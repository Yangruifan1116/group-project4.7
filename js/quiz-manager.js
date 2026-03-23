/**
 * 题库管理器
 * 管理选择题题目和答题逻辑
 */

class QuizManager {
   constructor() {
        // 题库数据 - 关于胡焕庸线的选择题
       this.questions = [
            {
                id: 'q1',
                question: '胡焕庸线是由哪位地理学家提出的？',
                options: [
                    'A. 胡焕庸',
                    'B. 李四光',
                    'C. 竺可桢',
                    'D. 黄汲清'
                ],
               correct: 0,
                explanation: '胡焕庸线由中国著名地理学家胡焕庸于 1935 年提出。'
            },
            {
                id: 'q2',
                question: '胡焕庸线主要划分了中国的什么分布特征？',
                options: [
                    'A. 地形高低',
                    'B. 人口密度',
                    'C. 气候类型',
                    'D. 植被类型'
                ],
               correct: 1,
                explanation: '胡焕庸线揭示了中国人口东南稠密、西北稀疏的分布特征。'
            },
            {
                id: 'q3',
                question: '胡焕庸线的东南侧大约占全国国土面积的多少？',
                options: [
                    'A. 23%',
                    'B. 36%',
                    'C. 43%',
                    'D. 57%'
                ],
               correct: 2,
                explanation: '胡焕庸线东南侧约占全国国土面积的 43%，却居住着约 94% 的人口。'
            },
            {
                id: 'q4',
                question: '以下哪项不是影响胡焕庸线形成的主要因素？',
                options: [
                    'A. 自然地理环境',
                    'B. 经济发展水平',
                    'C. 历史文化传统',
                    'D. 国际政治关系'
                ],
               correct: 3,
                explanation: '胡焕庸线的形成主要受自然地理、经济发展和历史文化影响，与国际政治关系关联较小。'
            },
            {
                id: 'q5',
                question: '胡焕庸线又被称为什么？',
                options: [
                    'A. 秦岭 - 淮河线',
                    'B. 黑河 - 腾冲线',
                    'C. 长城线',
                    'D. 长江线'
                ],
               correct: 1,
                explanation: '胡焕庸线从黑龙江黑河到云南腾冲，因此又称黑河 - 腾冲线。'
            },
            {
                id: 'q6',
                question: '东数西算工程的主要目的是什么？',
                options: [
                    'A. 将东部数据传输到西部存储',
                    'B. 优化全国算力资源配置',
                    'C. 在西部建设数据中心',
                    'D. 以上都是'
                ],
               correct: 3,
                explanation: '东数西算工程旨在通过构建新型算力网络，优化资源配置，促进东西部协同发展。'
            },
            {
                id: 'q7',
                question: '以下哪个手势在交互系统中表示"打开/展开"？',
                options: [
                    'A. 握拳',
                    'B. 张开手掌',
                    'C. 捏合手指',
                    'D. 挥手'
                ],
               correct: 1,
                explanation: '张开手掌手势被识别为 OPEN 状态，用于打开或展开视图。'
            },
            {
                id: 'q8',
                question: '粒子地形景观主要展示了什么？',
                options: [
                    'A. 中国地形地貌',
                    'B. 城市灯光分布',
                    'C. 人口密度变化',
                    'D. 交通网络'
                ],
               correct: 0,
                explanation: '开篇的粒子地形景观主要展示中国的地形地貌特征。'
            },
            {
                id: 'q9',
                question: '时空演变章节中，夜光数据的变化反映了什么？',
                options: [
                    'A. 气候变化',
                    'B. 经济发展和城市化进程',
                    'C. 季节更替',
                    'D. 地质变化'
                ],
               correct: 1,
                explanation: '夜光遥感数据可以反映一个地区的经济发展水平和城市化进程。'
            },
            {
                id: 'q10',
                question: '工程建设章节重点展示了哪个工程？',
                options: [
                    'A. 南水北调',
                    'B. 西气东输',
                    'C. 东数西算',
                    'D. 青藏铁路'
                ],
               correct: 2,
                explanation: '工程建设章节重点展示了东数西算工程的布局和枢纽节点。'
            }
        ];
        
        // 当前答题状态
       this.currentQuiz = null;
       this.userAnswers = [];
       this.currentIndex = 0;
    }
    
    /**
     * 获取所有题目
     */
    getAllQuestions() {
        return this.questions;
    }
    
    /**
     * 获取指定数量的随机题目
     */
    getRandomQuestions(count = 5) {
       const shuffled = [...this.questions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
    
    /**
     * 根据 ID 获取题目
     */
    getQuestionById(id) {
        return this.questions.find(q => q.id === id);
    }
    
    /**
     * 开始新的测验
     */
    startQuiz(mode = 'random', count = 5) {
        let questions;
        
        switch(mode) {
            case 'random':
                questions = this.getRandomQuestions(count);
                break;
            case 'all':
                questions = [...this.questions];
                break;
            case 'wrong':
                // 从用户的错题中选题
               const wrongQuestions = window.userManager.getWrongQuestions();
                if (wrongQuestions.length === 0) {
                    return { success: false, message: '暂无错题，先去练习吧！' };
                }
                questions = wrongQuestions.map(wq => wq.data).filter(q => q);
                break;
           default:
                questions = this.getRandomQuestions(count);
        }
        
        if (questions.length === 0) {
            return { success: false, message: '没有可用的题目' };
        }
        
       this.currentQuiz = {
            mode,
            questions,
            startTime: Date.now(),
            answers: [],
           completed: false
        };
        
       this.currentIndex = 0;
       this.userAnswers = [];
        
       console.log(`✅ 测验已开始：${mode} 模式，共 ${questions.length} 题`);
        return { success: true, questions, total: questions.length };
    }
    
    /**
     * 提交答案
     */
    submitAnswer(questionId, selectedOptionIndex) {
        if (!this.currentQuiz) {
            return { success: false, message: '测验未开始' };
        }
        
       const question = this.currentQuiz.questions[this.currentIndex];
        if (!question || question.id !== questionId) {
            return { success: false, message: '题目不匹配' };
        }
        
       const isCorrect = selectedOptionIndex === question.correct;
        
        // 记录答案
       const answer = {
            questionId,
            selectedIndex: selectedOptionIndex,
           correctIndex: question.correct,
            isCorrect,
            timestamp: Date.now()
        };
        
       this.userAnswers.push(answer);
       this.currentQuiz.answers.push(answer);
        
        // 移动到下一题
       this.currentIndex++;
        
        // 检查是否完成
        if (this.currentIndex >= this.currentQuiz.questions.length) {
           this.completeQuiz();
        }
        
        return {
            success: true,
            isCorrect,
           correctOption: question.correct,
            explanation: question.explanation,
            current: this.currentIndex,
            total: this.currentQuiz.questions.length
        };
    }
    
    /**
     * 完成测验
     */
   completeQuiz() {
        if (!this.currentQuiz) return;
        
       this.currentQuiz.completed = true;
       this.currentQuiz.endTime = Date.now();
        
        // 计算结果
       const correctCount = this.userAnswers.filter(a => a.isCorrect).length;
       const totalQuestions = this.currentQuiz.questions.length;
        
       const result = {
            mode: this.currentQuiz.mode,
            totalQuestions,
           correctCount,
            wrongCount: totalQuestions - correctCount,
            accuracy: ((correctCount / totalQuestions) * 100).toFixed(1) + '%',
            duration: Math.floor((this.currentQuiz.endTime - this.currentQuiz.startTime) / 1000),
            answers: this.userAnswers
        };
        
        // 保存答题记录到用户数据
        if (window.userManager.isLoggedIn()) {
           this.userAnswers.forEach(answer => {
               const question = this.currentQuiz.questions.find(q => q.id === answer.questionId);
                window.userManager.recordQuizResult(
                    answer.questionId,
                    answer.isCorrect,
                    question
                );
            });
        }
        
       console.log(`✅ 测验完成：正确率 ${result.accuracy}`);
        return result;
    }
    
    /**
     * 获取当前题目
     */
    getCurrentQuestion() {
        if (!this.currentQuiz || this.currentIndex >= this.currentQuiz.questions.length) {
            return null;
        }
        return this.currentQuiz.questions[this.currentIndex];
    }
    
    /**
     * 获取答题进度
     */
    getProgress() {
        if (!this.currentQuiz) return null;
        
        return {
            current: this.currentIndex + 1,
            total: this.currentQuiz.questions.length,
            percentage: ((this.currentIndex + 1) / this.currentQuiz.questions.length) * 100
        };
    }
    
    /**
     * 重置测验
     */
    reset() {
       this.currentQuiz = null;
       this.currentIndex = 0;
       this.userAnswers = [];
       console.log('✅ 测验已重置');
    }
    
    /**
     * 获取答题统计
     */
    getStats() {
        if (!this.currentQuiz) return null;
        
       const correctCount = this.userAnswers.filter(a => a.isCorrect).length;
        return {
            total: this.currentQuiz.questions.length,
           correct: correctCount,
            wrong: this.userAnswers.length - correctCount,
            accuracy: this.userAnswers.length > 0 
                ? ((correctCount / this.userAnswers.length) * 100).toFixed(1) + '%'
                : '0%'
        };
    }
}

// 创建全局实例
window.quizManager = new QuizManager();
