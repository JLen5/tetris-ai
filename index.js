const express = require('express')
const path = require('path')
const app = express()
const port = 31268

app.use(express.static('static'))
app.use('/scripts', express.static(__dirname + '/static/scripts'))
app.use('/styles', express.static(__dirname + '/static/styles'))
app.use('images', express.static(__dirname + '/static/images'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/pages/index.html')
})

app.listen(port, () => {
    console.log('Listening on ' + port)
})

