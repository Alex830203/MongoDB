const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// 連接到MongoDB資料庫
mongoose.connect('mongodb://127.0.0.1:27017/database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

  // 檢查資料庫中是否已存在具有相同 name 或 chatid 的記錄
  const existingItem = await Item.findOne({ $or: [{ groupName }, { chatID }] });
  if (existingItem) {
    return res.status(400).json({ error: 400, message: '已存在相同名稱或描述的項目。' });
  }

  // 如果不存在重複記錄，保存新項目到資料庫
  const item = new Item({ groupName, chatID });
  try {
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 500, message: '伺服器內部錯誤：' + err.message });
  }
});

// 定義DELETE請求的API路由
app.post('/api/delete', async (req, res) => {
  const chatID = req.body.chatID;

  try {
    // 在資料庫中查找並刪除指定chatid的文件
    const deletedItem = await Item.findOneAndDelete({ chatID: chatID });

    // 如果找不到指定chatid的文件，返回404 Not Found
    if (!deletedItem) {
      return res.status(404).json({ error: '指定的chatid不存在' });
    }

    res.json({ message: '已成功刪除', deletedItem });
  } catch (err) {
    // 如果刪除過程中出現錯誤，返回500 Internal Server Error
    res.status(500).json({ error: '無法刪除文件', details: err.message });
  }
});


// 啟動API服務
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
