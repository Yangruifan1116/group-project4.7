/**
 * 用户管理器
 * 处理用户登录、注册和本地数据存储
 */

class UserManager {
   constructor() {
       this.currentUser = null;
       this.STORAGE_KEY_USERS = 'hhy_users';
       this.STORAGE_KEY_CURRENT = 'hhy_current_user';
       this.STORAGE_KEY_QUIZ_RECORDS = 'hhy_quiz_records';
        
        // 自动登录
       this.autoLogin();
    }
    
    /**
     * 获取所有用户
     */
    getAllUsers() {
       const users = localStorage.getItem(this.STORAGE_KEY_USERS);
        return users ? JSON.parse(users) : [];
    }
    
    /**
     * 用户注册
     */
    register(username, password) {
        if (!username || !password) {
            return { success: false, message: '用户名和密码不能为空' };
        }
        
       const users = this.getAllUsers();
        
        // 检查用户是否已存在
        if (users.find(u => u.username === username)) {
            return { success: false, message: '用户名已存在' };
        }
        
        // 创建新用户
       const newUser = {
            id: Date.now().toString(),
            username,
            password, // 实际应用中应该加密
           createdAt: new Date().toISOString(),
            totalQuizzes: 0,
           correctCount: 0,
            wrongQuestions: [] // 错题 ID 列表
        };
        
        users.push(newUser);
        localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));
        
       console.log(`✅ 用户注册成功：${username}`);
        return { success: true, message: '注册成功', user: newUser };
    }
    
    /**
     * 用户登录
     */
    login(username, password) {
        if (!username || !password) {
            return { success: false, message: '请输入用户名和密码' };
        }
        
       const users = this.getAllUsers();
       const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            return { success: false, message: '用户名或密码错误' };
        }
        
        // 保存当前用户
       this.currentUser = user;
        localStorage.setItem(this.STORAGE_KEY_CURRENT, JSON.stringify(user));
        
       console.log(`✅ 用户登录成功：${username}`);
        return { success: true, message: '登录成功', user };
    }
    
    /**
     * 自动登录
     */
    autoLogin() {
       const currentUserStr = localStorage.getItem(this.STORAGE_KEY_CURRENT);
        if (currentUserStr) {
            try {
               this.currentUser = JSON.parse(currentUserStr);
               console.log(`✅ 自动登录成功：${this.currentUser.username}`);
                return this.currentUser;
            } catch (error) {
               console.error('❌ 自动登录失败:', error);
                return null;
            }
        }
        return null;
    }
    
    /**
     * 退出登录
     */
    logout() {
        localStorage.removeItem(this.STORAGE_KEY_CURRENT);
       this.currentUser = null;
       console.log('✅ 已退出登录');
    }
    
    /**
     * 获取当前登录用户
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    /**
     * 更新用户数据
     */
    updateUser(updatedUser) {
        if (!this.currentUser) {
            return { success: false, message: '用户未登录' };
        }
        
       const users = this.getAllUsers();
       const index = users.findIndex(u => u.id === this.currentUser.id);
        
        if (index === -1) {
            return { success: false, message: '用户不存在' };
        }
        
        // 更新用户数据
        users[index] = { ...users[index], ...updatedUser };
        localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));
        localStorage.setItem(this.STORAGE_KEY_CURRENT, JSON.stringify(users[index]));
       this.currentUser = users[index];
        
       console.log('✅ 用户数据已更新');
        return { success: true, message: '更新成功' };
    }
    
    /**
     * 记录答题结果
     */
    recordQuizResult(questionId, isCorrect, questionData) {
        if (!this.currentUser) {
            return { success: false, message: '用户未登录' };
        }
        
       const users = this.getAllUsers();
       const index = users.findIndex(u => u.id === this.currentUser.id);
        
        if (index === -1) {
            return { success: false, message: '用户不存在' };
        }
        
       const user = users[index];
        user.totalQuizzes = (user.totalQuizzes || 0) + 1;
        
        if (isCorrect) {
            user.correctCount = (user.correctCount || 0) + 1;
            // 如果之前有这道错题，移除它
            if (user.wrongQuestions) {
                user.wrongQuestions = user.wrongQuestions.filter(q => q.id !== questionId);
            }
        } else {
            // 添加错题
            if (!user.wrongQuestions) {
                user.wrongQuestions = [];
            }
            // 避免重复
           const exists = user.wrongQuestions.find(q => q.id === questionId);
            if (!exists) {
                user.wrongQuestions.push({
                    id: questionId,
                    data: questionData,
                    addedAt: new Date().toISOString()
                });
            }
        }
        
        // 更新用户数据
        users[index] = user;
        localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));
        localStorage.setItem(this.STORAGE_KEY_CURRENT, JSON.stringify(user));
       this.currentUser = user;
        
       console.log(`✅ 答题记录已保存：${isCorrect ? '正确' : '错误'}`);
        return { success: true };
    }
    
    /**
     * 获取用户的错题
     */
    getWrongQuestions() {
        if (!this.currentUser) {
            return [];
        }
        return this.currentUser.wrongQuestions || [];
    }
    
    /**
     * 清除错题记录
     */
    clearWrongQuestions() {
        if (!this.currentUser) {
            return { success: false, message: '用户未登录' };
        }
        
        return this.updateUser({ wrongQuestions: [] });
    }
    
    /**
     * 获取用户统计信息
     */
    getStats() {
        if (!this.currentUser) {
            return null;
        }
        
        return {
            username: this.currentUser.username,
            totalQuizzes: this.currentUser.totalQuizzes || 0,
           correctCount: this.currentUser.correctCount || 0,
            wrongCount: (this.currentUser.wrongQuestions || []).length,
            accuracy: this.currentUser.totalQuizzes > 0 
                ? ((this.currentUser.correctCount / this.currentUser.totalQuizzes) * 100).toFixed(1) + '%'
                : '0%'
        };
    }
}

// 创建全局实例
window.userManager = new UserManager();
