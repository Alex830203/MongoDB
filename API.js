const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

// Helper function to generate a random accessToken
function generateAccessToken() {
  return crypto.randomBytes(24).toString('hex');
}

const app = express();
const PORT = 3000;

// 使用CORS中間件
app.use(cors());

// 連接到MongoDB資料庫
// 使用環境變量存儲敏感信息
const dbURI = process.env.MONGO_URI || 'mongodb+srv://alex:0921988551@alex-db.gchr1ir.mongodb.net/?retryWrites=true&w=majority&appName=ALEX-DB';
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
  username: String,
  password: String,
  accessToken: String,
  logintime: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    default: 'player'
  },
  createdtime: {
    type: Date,
    default: Date.now
  }
}, {versionKey: false});

const User = mongoose.model('User', UserSchema);

const FoodSchema = new mongoose.Schema({
  date: String,
  name: String,
  type: String,
  createdtime: {
    type: Date,
    default: Date.now
  }
}, {versionKey: false});

const Food = mongoose.model('Food', FoodSchema);

const LuzhuSchema = new mongoose.Schema({
  bettime: String,
  result: String,
  createdtime: {
    type: Date,
    default: Date.now
  }
}, {versionKey: false});

const Luzhu = mongoose.model('Luzhu', LuzhuSchema);

const RankSchema = new mongoose.Schema({
  username: String,
  money: Number,
  createdtime: {
    type: Date,
    default: Date.now
  }
}, {versionKey: false});

const Rank = mongoose.model('Rank', RankSchema);

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

// 新增 遊戲登入 路由
app.post('/api/login', async (req, res) => {
  const { cmd, eventType, channelId, username, password, accessToken, timestamp, ip, signature } = req.body;

  if (cmd == 'UserInfo') {
    return res.status(200).json({ status: 200, message: '水水水' });
  }
  
  if (cmd !== 'RegisterOrLoginReq') {
    return res.status(400).json({ status: 400, message: 'Invalid command' });
  }

  try {
    // 查找用戶
    let user = await User.findOne({ username });

    if (!user) {
      // 如果用戶不存在，創建新用戶
      const accessToken = generateAccessToken();
      user = new User({
        username,
        password,
        logintime: new Date(timestamp * 1000),
        type: 'player',
        accessToken
      });
      await user.save();
    } else {
      // 如果用戶存在，檢查密碼
      if (user.password !== password && user.password !== accessToken) {
        return res.status(401).json({ status: 401, message: 'Invalid password' });
      }

      // 更新登錄時間和accessToken
      user.logintime = new Date(timestamp * 1000);
      user.accessToken = generateAccessToken();
      await user.save();
    }

    // 返回響應
    res.json({
      accessToken: user.accessToken,
      subChannelId: 0,
      username,
      status: 200
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: 'Internal server error', error: err.message });
  }
});

// 新增 後台登入 路由
app.post('/api/adminlogin', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 查找用戶
    let user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }

    // 檢查密碼
    if (user.password !== password) {
      return res.status(401).json({ status: 401, message: 'Invalid password' });
    }

    // 檢查用戶類型
    if (user.type !== 'admin') {
      return res.status(403).json({ status: 403, message: 'Access denied' });
    }

    // 更新accessToken
    user.accessToken = generateAccessToken();
    await user.save();

    // 返回響應
    res.json({
      accessToken: user.accessToken,
      username: user.username,
      type: user.type,  // 使用 user.type
      status: 200
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: 'Internal server error', error: err.message });
  }
});


app.get('/api/foodlist', async (req, res) => {
  try {
    const Foods = await Food.find();
    res.json(Foods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/addfood', async (req, res) => {
  const { date, name, type } = req.body;

  // 檢查資料庫中是否已存在具有相同 date 或 name 的記錄
  const existingFood = await Food.findOne({ $and: [{ date }, { name }] });
  if (existingFood) {
    return res.status(400).json({ error: 400, message: '已存在相同日期之店家' });
  }

  // 如果不存在重複記錄，保存新項目到資料庫
  const food = new Food({ date, name ,type});
  try {
    await food.save();
    res.json({ message: '已成功添加', food });
  } catch (err) {
    res.status(500).json({ error: 500, message: '伺服器內部錯誤：' + err.message });
  }
});

// 定義DELETE請求的API路由
app.post('/api/deletefood', async (req, res) => {
  const { date, name } = req.body;

  try {
    // 在資料庫中查找並刪除指定date和name的文件
    const deletedFood = await Food.findOneAndDelete({ date: date, name: name });

    // 如果找不到指定條件的文件，返回404 Not Found
    if (!deletedFood) {
      return res.status(404).json({ error: 400, message: '指定的date和name不存在' });
    }

    res.json({ message: '已成功刪除', deletedFood });
  } catch (err) {
    // 如果刪除過程中出現錯誤，返回500 Internal Server Error
    res.status(500).json({ error: '無法刪除文件', details: err.message });
  }
});

app.get('/api/luzhulist', async (req, res) => {
  try {
    const Luzhus = await Luzhu.find();
    res.json(Luzhus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/addluzhu', async (req, res) => {
  const { bettime, result } = req.body;

  try {
    // 檢查資料庫中已經有多少筆資料
    const count = await Luzhu.countDocuments();

    // 如果資料超過100筆，刪除最舊的資料
    if (count >= 100) {
      await Luzhu.findOneAndDelete({}, { sort: { createdtime: 1 } });
    }

    // 保存新項目到資料庫
    const luzhu = new Luzhu({ bettime, result });
    await luzhu.save();
    res.json({ message: '已成功添加', luzhu });
  } catch (err) {
    res.status(500).json({ error: 500, message: '伺服器內部錯誤：' + err.message });
  }
});

app.get('/api/ranklist', async (req, res) => {
  try {
    const Ranks = await Rank.find();
    res.json(Ranks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/addrank', async (req, res) => {
  const { username, money } = req.body;

  try {
    // 檢查資料庫中已經有多少筆資料
    const count = await Rank.countDocuments();

    // 如果資料超過10筆，刪除 money 最小的資料
    if (count >= 10) {
      await Rank.findOneAndDelete({}, { sort: { money: 1 } });
    }

    // 保存新項目到資料庫
    const rank = new Rank({ username, money });
    await rank.save();
    res.json({ message: '已成功添加', rank });
  } catch (err) {
    res.status(500).json({ error: 500, message: '伺服器內部錯誤：' + err.message });
  }
});

// 啟動API服務
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
