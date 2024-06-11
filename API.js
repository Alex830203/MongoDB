const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// 連接到MongoDB資料庫
// 使用環境變量存儲敏感信息
const dbURI = process.env.MONGO_URI || 'mongodb+srv://alex:0921988551@alex-db.gchr1ir.mongodb.net/';
mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// 定義MongoDB模型（Schema）
const ItemSchema = new mongoose.Schema({
  groupName: String,
  chatID: Number,
  createdtime: {
    type: Date,
    default: Date.now
  }
}, {versionKey: false});

const Item = mongoose.model('Item', ItemSchema);

const UserSchema = new mongoose.Schema({
  agentCode: String,
  userCode: String,
  createdtime: {
    type: Date,
    default: Date.now
  }
}, {versionKey: false});

const User = mongoose.model('User', UserSchema);

// 使用body-parser解析POST請求的JSON數據
app.use(bodyParser.json());

// 定義API路由
app.get('/api/list', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/add', async (req, res) => {
  const { groupName, chatID } = req.body;

  // 檢查資料庫中是否已存在具有相同 groupName 或 chatID 的記錄
  const existingItem = await Item.findOne({ $or: [{ groupName }, { chatID }] });
  if (existingItem) {
    return res.status(400).json({ error: 400, message: '已存在相同名稱或chatID' });
  }

  // 如果不存在重複記錄，保存新項目到資料庫
  const item = new Item({ groupName, chatID });
  try {
    await item.save();
    res.json({ message: '已成功添加', item });
  } catch (err) {
    res.status(500).json({ error: 500, message: '伺服器內部錯誤：' + err.message });
  }
});

// 定義DELETE請求的API路由
app.post('/api/delete', async (req, res) => {
  const chatID = req.body.chatID;

  try {
    // 在資料庫中查找並刪除指定chatID的文件
    const deletedItem = await Item.findOneAndDelete({ chatID: chatID });

    // 如果找不到指定chatID的文件，返回404 Not Found
    if (!deletedItem) {
      return res.status(404).json({ error: '指定的chatID不存在' });
    }

    res.json({ message: '已成功刪除', deletedItem });
  } catch (err) {
    // 如果刪除過程中出現錯誤，返回500 Internal Server Error
    res.status(500).json({ error: '無法刪除文件', details: err.message });
  }
});

app.get('/api/userlist', async (req, res) => {
  try {
    const Users = await User.find();
    res.json(Users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/adduser', async (req, res) => {
  const { agentCode, userCode } = req.body;

  // 檢查資料庫中是否已存在具有相同 groupName 或 chatID 的記錄
  const existingUser = await User.findOne({ $and: [{ agentCode }, { userCode }] });
  if (existingUser) {
    return res.status(400).json({ error: 400, message: '已存在相同代理之用戶名' });
  }

  // 如果不存在重複記錄，保存新項目到資料庫
  const user = new User({ agentCode, userCode });
  try {
    await user.save();
    res.json({ message: '已成功添加', user });
  } catch (err) {
    res.status(500).json({ error: 500, message: '伺服器內部錯誤：' + err.message });
  }
});

// 定義DELETE請求的API路由
app.post('/api/deleteuser', async (req, res) => {
  const userCode = req.body.userCode;

  try {
    // 在資料庫中查找並刪除指定chatID的文件
    const deletedUser = await User.findOneAndDelete({ userCode: userCode });

    // 如果找不到指定chatID的文件，返回404 Not Found
    if (!deletedUser) {
      return res.status(404).json({ error: 400, message: '指定的userCode不存在' });
    }

    res.json({ message: '已成功刪除', deletedUser });
  } catch (err) {
    // 如果刪除過程中出現錯誤，返回500 Internal Server Error
    res.status(500).json({ error: '無法刪除文件', details: err.message });
  }
});

// 啟動API服務
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
