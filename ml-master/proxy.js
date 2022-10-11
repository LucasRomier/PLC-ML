const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const got = require('got')

const app = express()
const port = 8081

app.use(cors())

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.post('/proxy-request', async (req, res) => {
    if (req.body.url) {
        try {
            const response = await got.get(req.body.url)
            res.status(response.statusCode).send(response.body)
        } catch (error) {
            res.status(400).send(error)
        }
    }
})

app.post('/proxy-form', async (req, res) => {
    if (req.body.url && req.body.data) {
        try {
            const response = await got.post(req.body.url, {
                form: req.body.data
            })
            res.status(response.statusCode).send(response.body)
        } catch (error) {
            res.status(400).send(error)
        }
    }
})

app.listen(port, () => {
    console.log(`Bypass Headers Proxy running on port ${port}`)
})