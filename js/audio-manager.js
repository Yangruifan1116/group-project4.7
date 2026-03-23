/**
 * 音频管理器
 * 处理背景音乐和场景音效
 */

class AudioManager {
    constructor() {
        this.bgMusic = null;
        this.isMuted = false;
        this.volume = 0.3;
        this.currentScene = null;
        
        // 音效库
        this.sounds = {
            sceneTransition: { frequency: 800, duration: 0.15, type: 'sine' },
            buttonHover: { frequency: 600, duration: 0.08, type: 'sine' },
            buttonClick: { frequency: 400, duration: 0.1, type: 'square' },
            success: { frequency: 1000, duration: 0.2, type: 'sine' },
            error: { frequency: 200, duration: 0.3, type: 'sawtooth' },
            gestureDetect: { frequency: 700, duration: 0.12, type: 'triangle' }
        };
        
        this.audioContext = null;
        this.init();
    }
    
    /**
     * 初始化音频系统
     */
    init() {
        console.log('🎵 初始化音频系统...');
        
        // 创建背景音乐元素
        this.bgMusic = document.createElement('audio');
        this.bgMusic.loop = true;
        this.bgMusic.volume = this.volume;
        
        // 尝试加载背景音乐文件
        const bgMusicSource = document.createElement('source');
        bgMusicSource.src = './audio/background.mp3';
        bgMusicSource.type = 'audio/mpeg';
        this.bgMusic.appendChild(bgMusicSource);
        
        // 设置用户交互后播放
        this.setupUserInteraction();
        
        console.log('✅ 音频系统初始化完成');
    }
    
    /**
     * 设置用户交互后播放
     */
    setupUserInteraction() {
        const startAudio = () => {
            this.playBackgroundMusic().catch(err => {
                console.log('⚠️ 背景音乐自动播放被阻止');
            });
            
            // 初始化 AudioContext（用于音效）
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
        };
        
        document.addEventListener('click', startAudio, { once: true });
        document.addEventListener('keydown', startAudio, { once: true });
    }
    
    /**
     * 播放背景音乐
     */
    async playBackgroundMusic() {
        if (this.isMuted) return;
        
        try {
            await this.bgMusic.play();
            console.log('▶️ 背景音乐播放中');
        } catch (error) {
            console.warn('⚠️ 背景音乐播放失败:', error.message);
        }
    }
    
    /**
     * 暂停背景音乐
     */
    pauseBackgroundMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
        }
    }
    
    /**
     * 切换静音
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.bgMusic) {
            this.bgMusic.muted = this.isMuted;
        }
        
        if (this.audioContext) {
            if (this.isMuted) {
                this.audioContext.suspend();
            } else {
                this.audioContext.resume();
            }
        }
        
        console.log(`🔇 静音状态：${this.isMuted ? '开启' : '关闭'}`);
        return this.isMuted;
    }
    
    /**
     * 设置音量
     */
    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        if (this.bgMusic) {
            this.bgMusic.volume = this.volume;
        }
    }
    
    /**
     * 播放音效
     */
    playSound(soundName) {
        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`⚠️ 音效未找到：${soundName}`);
            return;
        }
        
        if (this.isMuted || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = sound.frequency;
            oscillator.type = sound.type;
            
            // 音量包络
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, 
                this.audioContext.currentTime + sound.duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + sound.duration);
            
        } catch (error) {
            console.error('❌ 音效播放失败:', error);
        }
    }
    
    /**
     * 场景切换音效
     */
    playSceneTransition() {
        this.playSound('sceneTransition');
    }
    
    /**
     * 按钮悬停音效
     */
    playButtonHover() {
        this.playSound('buttonHover');
    }
    
    /**
     * 按钮点击音效
     */
    playButtonClick() {
        this.playSound('buttonClick');
    }
    
    /**
     * 成功音效
     */
    playSuccess() {
        this.playSound('success');
    }
    
    /**
     * 错误音效
     */
    playError() {
        this.playSound('error');
    }
    
    /**
     * 手势检测音效
     */
    playGestureDetect() {
        this.playSound('gestureDetect');
    }
}

// 创建全局实例
window.audioManager = new AudioManager();
