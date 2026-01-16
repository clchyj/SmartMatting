document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    const brushSizeInput = document.getElementById('brush-size');
    const brushSizeVal = document.getElementById('brush-size-val');
    const saveBtn = document.getElementById('save-btn');
    const bgFileInput = document.getElementById('bg-file-input');
    const customBgBtn = document.getElementById('custom-bg-btn');
    const bgColorPicker = document.getElementById('bg-color-picker');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    // 状态
    let state = {
        isDrawing: false,
        tool: 'erase', // 'erase' (make transparent) or 'restore' (bring back original)
        brushSize: 20,
        lastX: 0,
        lastY: 0,
        originalImage: null,  // 原始图片对象
        maskCanvas: null,     // 存储遮罩的canvas (黑白)
        bgType: 'transparent', // 'transparent', 'color', 'image'
        bgValue: null,        // color string or image object
        history: [],          // 历史记录栈，存储 imageData
        historyIndex: -1,     // 当前历史记录指针
        maxHistory: 20        // 最大历史步数
    };

    // 从 localStorage 加载数据
    loadFromStorage();

    // 事件监听
    // 工具切换
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.id === 'undo-btn' || btn.id === 'redo-btn') return;
            document.querySelectorAll('.tool-btn').forEach(b => {
                if (b.id !== 'undo-btn' && b.id !== 'redo-btn') b.classList.remove('active');
            });
            btn.classList.add('active');
            state.tool = btn.dataset.tool;
        });
    });

    // 撤销/重做
    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    // 画笔大小
    brushSizeInput.addEventListener('input', (e) => {
        state.brushSize = parseInt(e.target.value);
        brushSizeVal.textContent = state.brushSize;
    });

    // 背景切换
    document.querySelectorAll('.bg-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (btn.classList.contains('custom')) return; // handled separately
            
            document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            state.bgType = btn.dataset.type;
            if (state.bgType === 'color') {
                state.bgValue = btn.dataset.value;
            }
            renderCanvas();
        });
    });

    // 颜色选择器
    bgColorPicker.addEventListener('input', (e) => {
        state.bgType = 'color';
        state.bgValue = e.target.value;
        renderCanvas();
        
        // Update UI
        document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
    });

    // 自定义背景图片
    customBgBtn.addEventListener('click', () => bgFileInput.click());
    
    bgFileInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const url = await Utils.readFileAsDataURL(file);
            const img = await Utils.loadImage(url);
            
            state.bgType = 'image';
            state.bgValue = img;
            
            document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
            customBgBtn.classList.add('active');
            
            renderCanvas();
        }
    });

    // Canvas 绘图事件
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // 触摸支持
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener('touchend', () => {
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    });

    // 保存
    saveBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `edited-image-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // 历史记录管理
    function saveHistory() {
        if (!state.maskCanvas) return;
        
        // 如果当前不在历史记录末尾，删除后面的记录
        if (state.historyIndex < state.history.length - 1) {
            state.history = state.history.slice(0, state.historyIndex + 1);
        }
        
        // 保存当前 Mask 状态
        const maskData = state.maskCanvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        state.history.push(maskData);
        
        // 限制历史记录长度
        if (state.history.length > state.maxHistory) {
            state.history.shift();
        } else {
            state.historyIndex++;
        }
        
        updateHistoryButtons();
    }

    function undo() {
        if (state.historyIndex > 0) {
            state.historyIndex--;
            restoreHistory();
            updateHistoryButtons();
        }
    }

    function redo() {
        if (state.historyIndex < state.history.length - 1) {
            state.historyIndex++;
            restoreHistory();
            updateHistoryButtons();
        }
    }

    function restoreHistory() {
        const maskCtx = state.maskCanvas.getContext('2d');
        maskCtx.putImageData(state.history[state.historyIndex], 0, 0);
        renderCanvas();
    }

    function updateHistoryButtons() {
        undoBtn.disabled = state.historyIndex <= 0;
        redoBtn.disabled = state.historyIndex >= state.history.length - 1;
        
        undoBtn.style.opacity = undoBtn.disabled ? '0.5' : '1';
        redoBtn.style.opacity = redoBtn.disabled ? '0.5' : '1';
    }

    async function loadFromStorage() {
        const imageData = localStorage.getItem('edit_image_data');
        if (!imageData) {
            alert('没有找到待编辑的图片，请先上传');
            window.location.href = 'index.html';
            return;
        }

        try {
            state.originalImage = await Utils.loadImage(imageData);
            
            // 初始化 Canvas 大小
            canvas.width = state.originalImage.width;
            canvas.height = state.originalImage.height;
            
            // 检查是否有原图
            const originalSrc = localStorage.getItem('original_image_data');
            if (originalSrc) {
                state.originalImage = await Utils.loadImage(originalSrc);
            }
            
            // 初始化 Mask Canvas
            state.maskCanvas = document.createElement('canvas');
            state.maskCanvas.width = canvas.width;
            state.maskCanvas.height = canvas.height;
            const maskCtx = state.maskCanvas.getContext('2d');
            
            const processedImg = await Utils.loadImage(imageData);
            
            // 绘制 processedImg 到临时 canvas 获取 alpha
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(processedImg, 0, 0);
            
            // 重置 maskCanvas 为纯色但保留 Alpha
            const pData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
            for(let i=0; i<pData.data.length; i+=4) {
                pData.data[i] = 0; // Black
                pData.data[i+1] = 0;
                pData.data[i+2] = 0;
                // Alpha 保持不变
            }
            maskCtx.putImageData(pData, 0, 0);
            
            // 保存初始状态到历史记录
            saveHistory();
            
            renderCanvas();

        } catch (e) {
            console.error(e);
            alert('加载图片失败');
        }
    }

    function renderCanvas() {
        // 1. 清除
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. 绘制背景
        if (state.bgType === 'color' && state.bgValue) {
            ctx.fillStyle = state.bgValue;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (state.bgType === 'image' && state.bgValue) {
            // 缩放背景以填充
            const ratio = Math.max(canvas.width / state.bgValue.width, canvas.height / state.bgValue.height);
            const w = state.bgValue.width * ratio;
            const h = state.bgValue.height * ratio;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;
            ctx.drawImage(state.bgValue, x, y, w, h);
        }
        // transparent: do nothing (canvas is transparent)

        // 3. 绘制前景 (原图 + Mask)
        // 创建临时 canvas 组合原图和 mask
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // 绘制原图
        tempCtx.drawImage(state.originalImage, 0, 0);

        // 应用 Mask (destination-in: 只保留重叠部分，利用 mask 的 alpha)
        tempCtx.globalCompositeOperation = 'destination-in';
        tempCtx.drawImage(state.maskCanvas, 0, 0);

        // 绘制到主 canvas
        ctx.drawImage(tempCanvas, 0, 0);
    }

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }

    function startDrawing(e) {
        state.isDrawing = true;
        const pos = getMousePos(e);
        state.lastX = pos.x;
        state.lastY = pos.y;
        draw(e);
    }

    function stopDrawing() {
        if (state.isDrawing) {
            state.isDrawing = false;
            // 绘图结束时保存历史
            saveHistory();
        }
    }

    function draw(e) {
        if (!state.isDrawing) return;

        const pos = getMousePos(e);
        const maskCtx = state.maskCanvas.getContext('2d');

        maskCtx.lineWidth = state.brushSize;
        maskCtx.lineCap = 'round';
        maskCtx.lineJoin = 'round';

        if (state.tool === 'erase') {
            // 擦除 = 让 mask 变透明
            maskCtx.globalCompositeOperation = 'destination-out';
            maskCtx.strokeStyle = 'rgba(0,0,0,1)'; 
        } else {
            // 恢复 = 让 mask 变不透明
            maskCtx.globalCompositeOperation = 'source-over';
            maskCtx.strokeStyle = 'rgba(0,0,0,1)'; 
        }

        maskCtx.beginPath();
        maskCtx.moveTo(state.lastX, state.lastY);
        maskCtx.lineTo(pos.x, pos.y);
        maskCtx.stroke();

        state.lastX = pos.x;
        state.lastY = pos.y;

        renderCanvas();
    }
});