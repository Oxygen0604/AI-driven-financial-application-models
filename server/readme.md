<!-- 用于创建uploadQuesRoutes对应的数据库，即user_questions 表 -->
CREATE TABLE user_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL, -- 用户问题内容
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 问题创建时间
);

<!-- 用于创建extractResponseController对应的数据库，即ai_responses 表 -->
CREATE TABLE ai_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL, -- 关联的问题ID
    response_text TEXT NOT NULL, -- AI回答内容
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 回答创建时间
    FOREIGN KEY (question_id) REFERENCES user_questions(id)
);