# 使用官方的 Node.js 基礎鏡像
FROM node:16

# 設置工作目錄
WORKDIR /usr/src/app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製應用程式碼到容器內
COPY . .

# 暴露應用程序運行的端口
EXPOSE 3000

# 設置環境變量
ENV MONGO_URI=mongodb+srv://alex:0921988551@alex-db.gchr1ir.mongodb.net/?retryWrites=true&w=majority&appName=ALEX-DB

# 定義啟動命令
CMD [ "node", "API.js" ]
