/**
 * 主应用逻辑 - 数字胡焕庸线沉浸式体验
 * 负责场景管理、手势识别、音频控制、转场动画
 */

// 导入辅助模块（通过 script 标签加载）
// GlobalHandTracker 和 AudioManager 已在全局作用域

class ImmersiveExperience {
    constructor() {
        // 当前场景索引
        this.currentSceneIndex = 0;
        
        // 场景配置
        this.scenes = [
            {
                id: 'vision',
                name: '开篇展示',
                file: './poam.html',
                description: '粒子地形景观'
            },
            {
                id: 'earth',
                name: '地理认知',
                file: './hhy-line-intro.html',
                description: '3D 地球可视化'
            },
            {
                id: 'timeline',
                name: '时空演变',
                file: './hhy-line-light-data.html',
                description: '夜光数据演变'
            },
            {
                id: 'projects',
                name: '工程建设',
                file: './hhy-line-projects.html',
                description: '东数西算工程'
            },
            {
              id: 'quiz',
                name: '做题练习',
                file: './quiz.html',
              description: '选择题测试与错题巩固'
            }
        ];

        // 状态
        this.isMuted = false;
        this.isGuideVisible = false;
        this.isTransitioning = false;
        this.globalHandState = null;
       this.showQuizPrompt = false; // 是否显示答题提示
        
        // DOM 元素
        this.dom = {
            nav: document.getElementById('mainNav'),
            progressBar: document.getElementById('progressBar'),
            chapterBtns: document.querySelectorAll('.chapter-btn'),
            muteBtn: document.getElementById('muteBtn'),
            helpBtn: document.getElementById('helpBtn'),
            sceneContainer: document.getElementById('sceneContainer'),
            transitionOverlay: document.getElementById('transitionOverlay'),
            transitionText: document.getElementById('transitionText'),
            guidePanel: document.getElementById('guidePanel'),
            guideClose: document.getElementById('guideClose'),
            bgMusic: document.getElementById('bgMusic')
        };
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化应用
     */
    async init() {
        console.log('🚀 初始化沉浸式体验...');
        
        // 等待辅助模块加载
        await this.waitForModules();
        
        // 绑定事件
        this.bindEvents();
        
        // 加载第一个场景
        await this.loadScene(0);
        
        // 显示引导
        setTimeout(() => this.showGuide(), 500);
        
        // 设置全局手势追踪监听
        this.setupGlobalHandTracking();
        
        console.log('✅ 初始化完成');
    }
    
    /**
     * 等待辅助模块加载完成
     */
    async waitForModules() {
        const maxWait = 3000;
        const startTime = Date.now();
        
        while (!window.audioManager || !window.globalHandTracker) {
            if (Date.now() - startTime > maxWait) {
                console.warn('⚠️ 辅助模块加载超时，继续初始化');
                break;
            }
            await this.sleep(100);
        }
    }
    
    /**
     * 设置全局手势追踪
     */
    setupGlobalHandTracking() {
        if (window.globalHandTracker) {
            window.globalHandTracker.addListener((state) => {
                this.globalHandState = state;
                console.log('🖐️ 全局手势状态:', state);
                
                // 可以将手势状态广播到所有场景
                this.broadcastHandState(state);
            });
        }
    }
    
    /**
     * 广播手势状态到场景 iframe
     */
    broadcastHandState(state) {
        const iframes = this.dom.sceneContainer.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                iframe.contentWindow.postMessage({
                    type: 'HAND_STATE_UPDATE',
                    state: state
                }, '*');
            } catch (error) {
                // 跨域限制
            }
        });
    }
    
    /**
     * 绑定所有事件监听器
     */
    bindEvents() {
        // 章节导航点击
        this.dom.chapterBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                if (!this.isTransitioning) {
                    this.switchToScene(index);
                    if (window.audioManager) {
                        window.audioManager.playButtonClick();
                    }
                }
            });
            
            // 悬停音效
            btn.addEventListener('mouseenter', () => {
                if (window.audioManager) {
                    window.audioManager.playButtonHover();
                }
            });
        });
        
        // 静音按钮
        this.dom.muteBtn.addEventListener('click', () => {
            this.toggleMute();
            if (window.audioManager) {
                window.audioManager.playButtonClick();
            }
        });
        
        // 帮助按钮
        this.dom.helpBtn.addEventListener('click', () => {
            this.toggleGuide();
            if (window.audioManager) {
                window.audioManager.playButtonClick();
            }
        });
        
        // 关闭引导
        this.dom.guideClose.addEventListener('click', () => {
            this.hideGuide();
            if (window.audioManager) {
                window.audioManager.playButtonClick();
            }
        });
        
        // 点击引导面板外部关闭
        this.dom.guidePanel.addEventListener('click', (e) => {
            if (e.target === this.dom.guidePanel) {
                this.hideGuide();
            }
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseCurrentScene();
            } else {
                this.resumeCurrentScene();
            }
        });
        
        // 监听场景消息
        window.addEventListener('message', (e) => this.handleSceneMessage(e));
    }
    
    /**
     * 处理场景 iframe 发送的消息
     */
    handleSceneMessage(event) {
       const data = event.data;
        
        if (data.type === 'SCENE_INFO') {
           console.log(`📍 收到场景信息：${data.title}`);
            // 可以更新 UI 显示当前场景的详细信息
        }
        
        // 检测是否到达最后一个场景（自然交互）
        if (data.type === 'SCENE_COMPLETE' && data.scene === 'intro') {
           this.showQuizSelection();
        }
    }
    
    /**
     * 处理键盘事件
     */
    handleKeyboard(e) {
        switch(e.key) {
            case 'ArrowLeft':
                if (!this.isTransitioning && this.currentSceneIndex > 0) {
                    this.switchToScene(this.currentSceneIndex - 1);
                }
                break;
                
            case 'ArrowRight':
                if (!this.isTransitioning && this.currentSceneIndex < this.scenes.length - 1) {
                    this.switchToScene(this.currentSceneIndex + 1);
                }
                break;
                
            case 'm':
            case 'M':
                this.toggleMute();
                break;
                
            case 'h':
            case 'H':
                this.toggleGuide();
                break;
                
            case 'Escape':
                if (this.isGuideVisible) {
                    this.hideGuide();
                }
                break;
        }
    }
    
    /**
     * 加载场景
     */
    async loadScene(index) {
        const scene = this.scenes[index];
        
        console.log(`📦 加载场景：${scene.name}`);
        
        return new Promise((resolve, reject) => {
            // 创建 iframe
            const iframe = document.createElement('iframe');
            iframe.src = scene.file;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.setAttribute('allow', 'camera;microphone');
            iframe.setAttribute('allowfullscreen', 'true');
            
            // 清空容器并添加新 iframe
            this.dom.sceneContainer.innerHTML = '';
            this.dom.sceneContainer.appendChild(iframe);
            
            // 标记为活跃场景
            iframe.classList.add('active');
            
            // 更新进度条
            const progress = ((index + 1) / this.scenes.length) * 100;
            this.dom.progressBar.style.width = `${progress}%`;
            
            // 更新导航按钮状态
            this.dom.chapterBtns.forEach((btn, i) => {
                btn.classList.toggle('active', i === index);
            });
            
            iframe.onload = () => {
                console.log(`✅ 场景加载完成：${scene.name}`);
                resolve();
            };
            
            iframe.onerror = () => {
                console.error(`❌ 场景加载失败：${scene.name}`);
                reject(new Error(`Failed to load scene: ${scene.name}`));
            };
        });
    }
    
    /**
     * 切换到指定场景
     */
    async switchToScene(index) {
        if (this.isTransitioning || index === this.currentSceneIndex) return;
        
        this.isTransitioning = true;
        const targetScene = this.scenes[index];
        
        console.log(`🔄 切换到场景 ${index + 1}: ${targetScene.name}`);
        
        // 显示转场动画
        this.showTransition(`正在进入：${targetScene.name}`);
        
        // 淡出当前场景
        this.dom.sceneContainer.style.opacity = '0';
        this.dom.sceneContainer.style.transition = 'opacity 0.4s ease-in-out';
        
        await this.sleep(400);
        
        // 加载新场景
        await this.loadScene(index);
        this.currentSceneIndex = index;
        
        // 淡入新场景
        this.dom.sceneContainer.style.opacity = '1';
        
        // 隐藏转场动画
        setTimeout(() => {
            this.hideTransition();
            this.isTransitioning = false;
        }, 400);
        
        // 播放场景切换音效
        this.playSound('switch');
    }
    
    /**
     * 显示转场动画
     */
    showTransition(text = '加载中...') {
        this.dom.transitionText.textContent = text;
        this.dom.transitionOverlay.classList.add('active');
    }
    
    /**
     * 隐藏转场动画
     */
    hideTransition() {
        this.dom.transitionOverlay.classList.remove('active');
    }
    
    /**
     * 显示引导面板
     */
    showGuide() {
        this.isGuideVisible = true;
        this.dom.guidePanel.classList.add('active');
        this.playSound('open');
    }
    
    /**
     * 隐藏引导面板
     */
    hideGuide() {
        this.isGuideVisible = false;
        this.dom.guidePanel.classList.remove('active');
        this.playSound('close');
    }
    
    /**
     * 切换引导面板
     */
    toggleGuide() {
        if (this.isGuideVisible) {
            this.hideGuide();
        } else {
            this.showGuide();
        }
    }
    
    /**
     * 切换静音状态
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.dom.bgMusic.muted = this.isMuted;
        
        // 更新图标
        const icon = this.dom.muteBtn.querySelector('.icon');
        icon.textContent = this.isMuted ? '🔇' : '🔊';
        
        // 应用到所有 iframe 中的音频
        const iframes = this.dom.sceneContainer.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const audios = iframeDoc.querySelectorAll('audio, video');
                audios.forEach(media => {
                    media.muted = this.isMuted;
                });
            } catch (e) {
                // 跨域限制
            }
        });
        
        this.playSound(this.isMuted ? 'mute' : 'unmute');
    }
    
    /**
     * 设置音频
     */
    setupAudio() {
        // 首次用户交互后播放背景音乐
        const startAudio = () => {
            this.dom.bgMusic.volume = 0.3;
            this.dom.bgMusic.play().catch(err => {
                console.log('⚠️ 自动播放被阻止，等待用户交互');
            });
            
            // 移除监听器
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
        };
        
        document.addEventListener('click', startAudio, { once: true });
        document.addEventListener('keydown', startAudio, { once: true });
    }
    
    /**
     * 播放音效
     */
    playSound(type) {
        // 这里可以添加具体的音效文件
        // 暂时使用 Web Audio API 生成简单提示音
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(type) {
            case 'switch':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
                break;
                
            case 'open':
                oscillator.frequency.value = 600;
                gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
                
            case 'close':
                oscillator.frequency.value = 400;
                gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
        }
    }
    
    /**
     * 暂停当前场景
     */
    pauseCurrentScene() {
        const iframes = this.dom.sceneContainer.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const videos = iframeDoc.querySelectorAll('video');
                videos.forEach(video => video.pause());
            } catch (e) {
                // 跨域限制
            }
        });
        
        if (this.dom.bgMusic) {
            this.dom.bgMusic.pause();
        }
    }
    
    /**
     * 恢复当前场景
     */
    resumeCurrentScene() {
       const iframes = this.dom.sceneContainer.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
               const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
               const videos = iframeDoc.querySelectorAll('video');
                videos.forEach(video => video.play());
            } catch (e) {
                // 跨域限制
            }
        });
        
        if (this.dom.bgMusic && !this.isMuted) {
           this.dom.bgMusic.play();
        }
    }
    
    /**
     * 显示答题选择页面
     */
    showQuizSelection() {
        // 检查用户是否已登录
        if (!window.userManager || !window.userManager.isLoggedIn()) {
           console.log('⚠️ 用户未登录，不显示答题提示');
            return;
        }
        
        // 避免重复显示
        if (this.showQuizPrompt) return;
        
       this.showQuizPrompt = true;
        
        // 创建答题选择面板
       const quizPanel = document.createElement('div');
        quizPanel.id = 'quizPromptPanel';
        quizPanel.className = 'guide-panel';
        quizPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            max-width: 600px;
            width: 90%;
        `;
        
        quizPanel.innerHTML = `
            <button class="guide-close" id="quizPromptClose">&times;</button>
            <h3 style="color: var(--accent); margin-bottom: 20px;">🎉 讲解演示结束！</h3>
            <div style="margin: 24px 0;">
                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                    恭喜您完成了所有讲解内容的学习！现在可以选择进行练习测试，巩固所学知识。
                </p>
                <div style="display: grid; gap: 12px;">
                    <button class="btn-primary" id="goToNewQuiz" style="padding: 14px; font-size: 16px;">
                        🆕 新题练习
                    </button>
                    <button class="btn-secondary" id="goToWrongReview" style="padding: 14px; font-size: 16px;">
                        📖 错题巩固
                    </button>
                    <button class="btn-secondary" id="continueBrowsing" style="padding: 14px; font-size: 16px;">
                        ↩️ 继续浏览
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(quizPanel);
        
        // 绑定事件
        document.getElementById('quizPromptClose').addEventListener('click', () => {
           this.hideQuizSelection();
        });
        
        document.getElementById('goToNewQuiz').addEventListener('click', () => {
            window.location.href = 'quiz.html';
        });
        
        document.getElementById('goToWrongReview').addEventListener('click', () => {
            window.location.href = 'review.html';
        });
        
        document.getElementById('continueBrowsing').addEventListener('click', () => {
           this.hideQuizSelection();
        });
        
        // 播放提示音
        if (window.audioManager) {
            window.audioManager.playSuccess();
        }
    }
    
    /**
     * 隐藏答题选择页面
     */
    hideQuizSelection() {
       const panel = document.getElementById('quizPromptPanel');
        if (panel) {
            panel.remove();
        }
       this.showQuizPrompt = false;
    }

    /**
     * 工具函数：延迟
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 启动应用
window.addEventListener('DOMContentLoaded', () => {
    window.app = new ImmersiveExperience();
});
