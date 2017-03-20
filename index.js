var path = require('path')
var express = require('express')
var session = require('express-session')
var MongoStore = require('connect-mongo')(session)
var flash = require('connect-flash')
var config = require('config-lite') ///会依次降级访问 config/**.js */
var routes = require('./routes')
var app = express()

//设置模版目录
app.set('views',path.join(__dirname,'views'));
//设置模版引擎为ejs
app.set('view engine','ejs')


//中间件的加载顺序很重要。如设置静态文件目录的中间件应该放到 routes(app) 之前加载，这样静态文件的请求就不会落到业务逻辑的路由里；flash 中间件应该放到 session 中间件之后加载，因为 flash 是基于 session 的。


//设置静态文件目录
app.use(express.static(path.join(__dirname,'public')));
//session 中间件

app.use(session({
    name: config.session.key, //设置 cookie 中保存 session id 的字段名称
    secret: config.session.secret, // 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
    cookie: {
        maxAge: config.session.maxAge // 过期时间，过期后 cookie 中的 session id 自动删除
    },
    store: new MongoStore({ //将 session 存储到 mongodb
        url: config.mongodb //mongodb 地址
    })
}));
//flash 中间件，用来显示通知
app.use(flash());

// 处理表单及文件上传的中间件
app.use(require('express-formidable')({
  uploadDir: path.join(__dirname, 'public/img'),// 上传文件目录
  keepExtensions: true// 保留后缀
}));

//设置模版全局变量
app.locals.blog = {
    title: 'Blog',
    description: 'welcome!'
}

app.use((req,res,next)=>{
    res.locals.user = req.session.user;
    res.locals.success = req.flash('success').toString();
    res.locals.error = req.flash('error').toString();
    next()
})

// 路由
routes(app);

app.listen(config.port,function(){
    console.log(`listening on ${config.port}`)
})