// 图像处理逻辑

const ImageProcessor = {
    model: null,
    
    // 初始化 MediaPipe Selfie Segmentation 模型
    async init() {
        if (this.model) return;
        
        if (typeof SelfieSegmentation === 'undefined') {
            throw new Error('MediaPipe SelfieSegmentation library not loaded');
        }

        try {
            // 使用 MediaPipe SelfieSegmentation
            const selfieSegmentation = new SelfieSegmentation({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1/${file}`;
                }
            });

            selfieSegmentation.setOptions({
                modelSelection: 1, // 1 for landscape (better quality), 0 for square (faster)
                selfieMode: false,
            });

            this.model = selfieSegmentation;
            return true;
        } catch (error) {
            console.error('Model initialization error:', error);
            throw error;
        }
    },

    // 移除背景
    async removeBackground(imageElement) {
        if (!this.model) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            // 创建离屏 Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = imageElement.width;
            canvas.height = imageElement.height;
            
            // 启用平滑处理
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // 设置回调
            this.model.onResults((results) => {
                // 1. 准备 Mask Canvas
                const maskCanvas = document.createElement('canvas');
                maskCanvas.width = canvas.width;
                maskCanvas.height = canvas.height;
                const maskCtx = maskCanvas.getContext('2d');
                maskCtx.imageSmoothingEnabled = true;
                maskCtx.imageSmoothingQuality = 'high';
                
                // 绘制原始 Mask
                maskCtx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

                // 2. 绘制原图到主 Canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
                
                // 3. 获取像素数据进行精细处理
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
                
                // 优化参数
                const thresholdLower = 25;  // 低于此值的 Alpha 设为 0 (去除背景噪声)
                const thresholdUpper = 240; // 高于此值的 Alpha 设为 255 (确保主体不透明)
                
                for (let i = 0; i < imageData.data.length; i += 4) {
                    // maskData 的 R 通道值作为原始透明度
                    let alpha = maskData.data[i]; 
                    
                    // 应用 S 曲线对比度增强和阈值处理
                    if (alpha < thresholdLower) {
                        alpha = 0;
                    } else if (alpha > thresholdUpper) {
                        alpha = 255;
                    } else {
                        // 线性平滑过渡，避免边缘锯齿
                        alpha = (alpha - thresholdLower) / (thresholdUpper - thresholdLower) * 255;
                    }
                    
                    // 设置最终透明度
                    imageData.data[i + 3] = alpha;
                }
                
                ctx.putImageData(imageData, 0, 0);
                
                resolve(canvas.toDataURL('image/png'));
            });

            // 发送图片进行处理
            this.model.send({image: imageElement}).catch(reject);
        });
    }
};