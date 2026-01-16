// 主程序逻辑

document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadSection = document.getElementById('upload-section');
    const processingSection = document.getElementById('processing-section');
    const resultSection = document.getElementById('result-section');
    const originalImage = document.getElementById('original-image');
    const resultImage = document.getElementById('result-image');
    const reuploadBtn = document.getElementById('reupload-btn');
    const downloadBtn = document.getElementById('download-btn');

    // 初始化 AI 模型
    ImageProcessor.init().then(() => {
        console.log('AI Model Initialized');
    }).catch(err => {
        console.error('Failed to init AI model:', err);
        alert('AI模型加载失败，请刷新页面重试');
    });

    // 上传相关事件监听
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    reuploadBtn.addEventListener('click', () => {
        resetUI();
    });

    downloadBtn.addEventListener('click', () => {
        if (resultImage.src) {
            const link = document.createElement('a');
            link.download = `removed-bg-${Date.now()}.png`;
            link.href = resultImage.src;
            link.click();
        }
    });

    // 处理文件
    async function handleFile(file) {
        if (!file.type.match('image.*')) {
            alert('请上传图片文件 (JPG/PNG)');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('图片大小不能超过 10MB');
            return;
        }

        // 显示处理中状态
        showProcessing();

        try {
            // 读取图片
            const imageUrl = await Utils.readFileAsDataURL(file);
            originalImage.src = imageUrl;

            // 加载图片对象
            const imgElement = await Utils.loadImage(imageUrl);

            // 执行抠图
            const processedImageData = await ImageProcessor.removeBackground(imgElement);
            
            // 显示结果
            resultImage.src = processedImageData;
            
            // 保存到 localStorage 供编辑器使用
            try {
                localStorage.setItem('edit_image_data', processedImageData);
                localStorage.setItem('original_image_data', imageUrl);
            } catch (e) {
                console.warn('Storage quota exceeded or error', e);
            }

            showResult();
        } catch (error) {
            console.error('Error processing image:', error);
            alert('处理图片时出错，请重试');
            resetUI();
        }
    }

    // UI 状态切换
    function showProcessing() {
        uploadSection.classList.add('hidden');
        processingSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
    }

    function showResult() {
        uploadSection.classList.add('hidden');
        processingSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
    }

    function resetUI() {
        fileInput.value = '';
        originalImage.src = '';
        resultImage.src = '';
        uploadSection.classList.remove('hidden');
        processingSection.classList.add('hidden');
        resultSection.classList.add('hidden');
    }
});