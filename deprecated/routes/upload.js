const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', // MOV
    'text/plain', 'text/markdown',
    'text/javascript', 'application/javascript',
    'text/x-python', 'application/x-python-code',
    'text/x-java', 'text/x-c++', 'text/x-c',
    'application/json', 'text/xml',
    'text/html', 'text/css',
    'application/pdf', // PDF
    'application/epub+zip' // EPUB
  ];
  
  if (allowedTypes.includes(file.mimetype) || 
      file.originalname.match(/\.(mp4|webm|ogg|mov|txt|md|js|py|java|cpp|c|json|xml|html|css|pdf|epub)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 计算最大文件大小（默认200MB，支持视频和PDF等大文件）
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 200 * 1024 * 1024; // 默认200MB

const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter: fileFilter
});

// 上传文件
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      // 检查是否是文件过大错误
      if (req.fileValidationError) {
        return res.status(400).json({ error: req.fileValidationError });
      }
      return res.status(400).json({ error: '没有上传文件' });
    }

    // 处理文件名编码，确保中文文件名正确保存
    // multer默认将文件名转换为latin1编码，需要转换回UTF-8
    let originalFilename = req.file.originalname;
    try {
      // 尝试将latin1编码的文件名转换为UTF-8
      originalFilename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    } catch (e) {
      // 如果转换失败，使用原始文件名
      console.warn('文件名编码转换失败，使用原始文件名:', e);
    }
    
    const fileInfo = {
      id: req.file.filename, // 使用存储的文件名作为ID
      filename: originalFilename, // 正确处理中文文件名
      storedName: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadTime: new Date().toISOString()
    };

    res.json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    console.error('上传错误:', error);
    
    // 处理文件过大错误
    if (error.code === 'LIMIT_FILE_SIZE' || error.name === 'MulterError') {
      const maxSizeMB = (parseInt(process.env.MAX_FILE_SIZE) || 200 * 1024 * 1024) / (1024 * 1024);
      return res.status(413).json({ 
        error: '文件过大',
        message: `文件大小超过了限制（最大 ${maxSizeMB}MB）`,
        maxSize: maxSizeMB,
        details: '请压缩文件或选择较小的文件上传'
      });
    }
    
    res.status(500).json({ error: error.message || '上传失败' });
  }
});

// 错误处理中间件（专门处理multer错误）
// 注意：这个中间件需要放在路由之后，但由于multer的错误会在上传路由中被捕获，这里作为备用
router.use((error, req, res, next) => {
  // 检查是否是multer错误
  if (error.name === 'MulterError' || error.code === 'LIMIT_FILE_SIZE') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      const maxSizeMB = (parseInt(process.env.MAX_FILE_SIZE) || 200 * 1024 * 1024) / (1024 * 1024);
      return res.status(413).json({ 
        error: '文件过大',
        message: `文件大小超过了限制（最大 ${maxSizeMB}MB）`,
        maxSize: maxSizeMB,
        details: '请压缩文件或选择较小的文件上传'
      });
    }
    return res.status(400).json({ error: '文件上传错误: ' + error.message });
  }
  next(error);
});

// 处理OPTIONS预检请求（CORS）
router.options('/:fileId/content', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24小时
  res.sendStatus(204);
});

// 获取文件内容（文本文件）或直接提供文件（视频等）
router.get('/:fileId/content', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const filePath = path.join(uploadDir, fileId);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 判断文件类型
    const ext = path.extname(filePath).toLowerCase();
    const isVideo = ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
    const isPDF = ext === '.pdf';
    const isEPUB = ext === '.epub';
    
    if (isVideo) {
      // 视频文件直接返回文件流
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;
      
      // 根据文件扩展名确定Content-Type
      const contentTypeMap = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime'
      };
      const contentType = contentTypeMap[ext] || 'video/mp4';

      if (range) {
        // 支持视频流式传输
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': contentType,
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } else if (isPDF) {
      // PDF文件直接返回文件流
      const stat = fs.statSync(filePath);
      const fileName = path.basename(filePath);
      
      // 处理中文文件名编码问题（使用RFC 5987格式）
      const encodedFileName = encodeURIComponent(fileName);
      
      // 设置正确的响应头
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
      
      // 允许跨域访问（用于iframe和object标签）
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
      
      // 允许在iframe/embed中加载（关键！）
      res.removeHeader('X-Frame-Options'); // 移除可能存在的X-Frame-Options
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // 允许缓存以提高性能
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // 支持范围请求（用于大文件）
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'application/pdf',
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff',
        });
        file.pipe(res);
      } else {
        fs.createReadStream(filePath).pipe(res);
      }
    } else if (isEPUB) {
      // EPUB文件返回文件流（浏览器可能不支持直接显示，需要特殊处理）
      const stat = fs.statSync(filePath);
      const fileName = path.basename(filePath);
      const encodedFileName = encodeURIComponent(fileName);
      
      res.setHeader('Content-Type', 'application/epub+zip');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      fs.createReadStream(filePath).pipe(res);
    } else {
      // 文本文件返回JSON
      const content = fs.readFileSync(filePath, 'utf-8');
      res.json({ content });
    }
  } catch (error) {
    console.error('读取文件错误:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

