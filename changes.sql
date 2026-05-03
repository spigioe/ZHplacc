-- Active: 1777643552789@@zh-placc-database-zh-placc.h.aivencloud.com@11445@defaultdb
-- Active: 1777643552789@@zh-placc-database-zh-placc.h.aivencloud.com@11445@mysql552789@@zh-placc-database-zh-placc.h.aivencloud.com@11445@defaultdb552789@@zh-placc-database-zh-placc.h.aivencloud.com@11445@defaultdb
ALTER TABLE Users 
ADD COLUMN profile_picture_url LONGTEXT DEFAULT NULL,
ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL,
ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL;

CREATE TABLE Todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

SELECT * FROM `Users`