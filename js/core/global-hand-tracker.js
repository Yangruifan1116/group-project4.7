/**
 * 全局手势识别管理器
 * 提供统一的手势识别 API，可在不同场景间共享状态
 * Modified: Added landmarks passing for finger counting
 */

class GlobalHandTracker {
    constructor() {
        // 手势状态
        this.state = {
            isTracking: false,
            currentGesture: null,
            handPosition: { x: 0.5, y: 0.5 },
            pinchStrength: 0,
            handRotation: 0,
            landmarks: null, // 🔥 新增：用于存储手部骨架数据
            appState: 'OPEN' // OPEN, CLOSED, ZOOM
        };

        // 监听器
        this.listeners = new Set();

        // MediaPipe 实例
        this.hands = null;
        this.cameraFeed = null;

        // 初始化
        this.init();
    }

    /**
     * 初始化手势追踪
     */
    async init() {
        console.log('🖐️ 初始化全局手势追踪...');

        // 检查 MediaPipe 是否可用
        if (!window.Hands) {
            console.warn('⚠️ MediaPipe Hands 未加载，尝试动态加载...');
            try {
                await this.loadMediaPipe();
                console.log('✅ MediaPipe 动态加载完成');
            } catch (e) {
                console.error('❌ MediaPipe 加载失败', e);
            }
        } else {
            console.log('✅ MediaPipe 已存在');
        }
    }

    /**
     * 动态加载 MediaPipe
     */
    loadMediaPipe() {
        return new Promise((resolve, reject) => {
            if (window.Hands) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load MediaPipe'));
            document.head.appendChild(script);
        });
    }

    /**
     * 启动摄像头和手势识别
     */
    async startCamera(videoElement) {
        // 确保 MediaPipe 已加载
        if (!window.Hands) {
            console.log('⏳ 等待 MediaPipe 加载...');
            await this.loadMediaPipe();
        }

        try {
            // 先关闭之前的实例（如果有）
            await this.stopCamera();

            console.log('🎥 准备启动摄像头...');

            // 创建 Hands 实例
            this.hands = new window.Hands({
                locateFile: (file) =>
                    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7
            });

            this.hands.onResults((results) => {
                this.processResults(results);
            });

            // 设置视频元素属性
            videoElement.setAttribute('autoplay', 'true');
            videoElement.setAttribute('playsinline', 'true');
            videoElement.muted = true;

            // 创建摄像头实例
            // 注意：需要确保 camera_utils.js 也已引入
            if (!window.Camera) {
                throw new Error("MediaPipe Camera Utils script not loaded");
            }

            this.cameraFeed = new window.Camera(videoElement, {
                onFrame: async () => {
                    if (this.hands) {
                        await this.hands.send({ image: videoElement });
                    }
                },
                width: 1280,
                height: 720
            });

            await this.cameraFeed.start();
            this.state.isTracking = true;

            console.log('✅ 摄像头启动成功');
            this.notifyListeners();

        } catch (error) {
            console.error('❌ 摄像头启动失败:', error);
            // 尝试通知监听器发生了错误，或者至少状态为停止
            this.state.isTracking = false;
            this.notifyListeners();
            throw error;
        }
    }

    /**
     * 处理手势识别结果
     */
    processResults(results) {
        // 获取第一只手的数据
        const landmarks = results.multiHandLandmarks?.[0];

        if (!landmarks) {
            this.state.isTracking = false;
            this.state.currentGesture = 'none';
            this.state.landmarks = null; // 清空骨架数据
            this.notifyListeners();
            return;
        }

        this.state.isTracking = true;
        // 🔥 关键修改：保存骨架数据，以便外部使用（如数手指）
        this.state.landmarks = landmarks;

        // 分类手势（用于原有的菜单导航等）
        const gesture = this.classifyGesture(landmarks);

        this.state.currentGesture = gesture.name;
        this.state.pinchStrength = gesture.pinchStrength;
        this.state.handRotation = gesture.rotation;
        this.state.handPosition = gesture.position;
        this.state.appState = this.mapGestureToState(gesture);

        // 通知所有监听器
        this.notifyListeners();
    }

    /**
     * 手势分类（保持原有逻辑，用于光标控制）
     */
    classifyGesture(landmarks) {
        const wrist = landmarks[0];
        const indexMcp = landmarks[5];
        const middleMcp = landmarks[9];

        // 计算手部尺寸作为参考基准
        const handSize = Math.max(0.001, this.dist2(wrist, middleMcp));

        // 捏合检测 (食指+拇指)
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const pinchDist = this.dist2(thumbTip, indexTip);

        // 动态阈值判断捏合
        const pinch = pinchDist < handSize * 0.35;
        const pinchStrength = this.clamp01(1 - pinchDist / (handSize * 0.55));

        // 手指伸展检测（用于简单的 Fist/Open Palm 判断）
        const fingerDefs = [
            { name: 'index', tip: 8, pip: 6 },
            { name: 'middle', tip: 12, pip: 10 },
            { name: 'ring', tip: 16, pip: 14 },
            { name: 'pinky', tip: 20, pip: 18 }
        ];

        let extendedCount = 0;
        for (const f of fingerDefs) {
            const tip = landmarks[f.tip];
            const pip = landmarks[f.pip];
            const tipD = this.dist2(wrist, tip);
            const pipD = this.dist2(wrist, pip);
            // 如果指尖距离手腕 比 指关节距离手腕 远一定程度，认为是伸展
            if (tipD > pipD + handSize * 0.12) extendedCount += 1;
        }

        const openPalm = extendedCount >= 3 && !pinch;
        const fist = extendedCount <= 1 && !pinch;

        // 计算旋转角度
        const dx = indexMcp.x - wrist.x;
        const dy = indexMcp.y - wrist.y;
        const rotation = Math.atan2(dy, dx);

        // 确定手势名称
        let name = 'unknown';
        if (pinch) name = 'pinch';
        else if (openPalm) name = 'open_palm';
        else if (fist) name = 'fist';

        return {
            name,
            pinch,
            pinchStrength,
            openPalm,
            fist,
            rotation,
            // 注意：这里做了 X 轴镜像翻转 (1 - x)，为了配合前置摄像头镜像体验
            position: { x: 1 - landmarks[8].x, y: landmarks[8].y }
        };
    }

    /**
     * 将手势映射到应用状态
     */
    mapGestureToState(gesture) {
        if (gesture.pinch) return 'ZOOM';
        if (gesture.openPalm) return 'OPEN';
        if (gesture.fist) return 'CLOSED';
        return 'OPEN';
    }

    /**
     * 停止摄像头
     */
    stopCamera() {
        if (this.cameraFeed) {
            try {
                this.cameraFeed.stop();
            } catch (e) { console.warn(e); }
            this.cameraFeed = null;
        }

        if (this.hands) {
            try {
                this.hands.close();
            } catch (e) { console.warn(e); }
            this.hands = null;
        }

        this.state.isTracking = false;
        this.notifyListeners();

        console.log('📴 摄像头已停止');
    }

    /**
     * 添加状态变化监听器
     */
    addListener(callback) {
        this.listeners.add(callback);
        // 立即回调一次当前状态
        callback({ ...this.state });
        return () => this.listeners.delete(callback);
    }

    /**
     * 移除监听器
     */
    removeListener(callback) {
        this.listeners.delete(callback);
    }

    /**
     * 通知所有监听器
     */
    notifyListeners() {
        // 创建状态副本，防止外部修改内部状态
        const stateCopy = { ...this.state };

        this.listeners.forEach(callback => {
            try {
                callback(stateCopy);
            } catch (error) {
                console.error('Hand tracker listener error:', error);
            }
        });
    }

    /**
     * 获取当前状态
     */
    getState() {
        return { ...this.state };
    }

    /**
     * 工具函数：两点距离
     */
    dist2(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.hypot(dx, dy);
    }

    /**
     * 工具函数：限制在 0-1
     */
    clamp01(v) {
        return Math.max(0, Math.min(1, v));
    }
}

// 创建全局实例
window.globalHandTracker = new GlobalHandTracker();
