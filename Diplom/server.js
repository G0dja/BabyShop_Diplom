import http from 'http'
import fileSystem from 'fs/promises'
import sendMail from './nodemailer.js'
import path from 'path'
import config from './config.js'
import { file } from 'googleapis/build/src/apis/file/index.js'

const __dirname = path.resolve()

const PORT = process.env.PORT || 80

const server = http.createServer(async (req, res) => { // создаем обьект сервера

  const url = new URL('https://localhost' + req.url)
  if(requestHandlers[url.pathname]) {
    requestHandlers[url.pathname](req, res, url)
    return
  }

  if(req.method === 'GET') { // если метод обращения к серверу равен GET

    if(url.pathname === '/') url.pathname = '/index.html' // обозначаем index.html как стартовую страницу сайта
    else if(url.pathname.match(/\..+/) === null) url.pathname += '.html'

    fileSystem.readFile(__dirname + url.pathname).then(content => { // считывание файла по пути дериктории поректа + пути запроса
    
      let contentType = 'text/plain' // переменная для хранения типа запрашиваемого ресурса, по умолчанию задано значение обычного текста

      switch(url.pathname.match(/\..+$/)[0]) { // switch конструкция содержащая регулярное выражение что бы опредилить тип запрашиваемого ресурса
        case '.js': // если javascript файл
          contentType = 'text/javascript' // то устанавливаем тип как javascript
          break
        case '.css': // если css файл
          contentType = 'text/css' // то устанавливаем тип как css
          break
        case '.html': // если html файл
          contentType = 'text/html' // то устанавливаем тип как html
          break
      }

      res.writeHead(200, {'Content-Type': contentType}) // запись кода ответа как "OK" и формата ответа в виде JSON
      res.write(content) // запись содержимого ответа
      res.end() // обозначение что ответ закончен и может быть отправлен

    }).catch(err => { // если ошибка считывания файла
      res.writeHead(404, {'Content-Type': 'text/html'}) // запись кода ответа как "Страница не найдена" и формата ответа в виде HTML страницы
      res.write('<meta charset="utf-8">') // запись содержимого в ответ
      res.write('<h1><strong>404</strong> error, page not found<h1>') // запись содержимого в ответ
      // res.write(`<pre>${err}</pre>`) // запись содержимого в ответ
      res.end() // обозначение что ответ закончен и может быть отправлен
    })
  }

  else if(req.method === 'POST') { // если метод обращения к серверу равен POST
    res.writeHead(200, {'Content-Type': 'application/json'}) // запись кода ответа как "Нет содержимого" и формата ответа в виде JSON
    res.write(JSON.stringify({ // запись содержимого ответа и его кодировка в json обьект 
      answer: 'request received' // здесь можно записать любую заглушку
    }))
    res.end() // обозначение что ответ закончен и может быть отправлен
  }

  else { // если метод обращения к серверу равен другому значению
    res.writeHead(405, {'Content-Type': 'text/plain'}) // запись кода ответа типа "Метод не разрешён" и формата ответа в виде обычного текста
    res.end('Invalid request') // обозначение что ответ закончен и может быть отправлен
  }

}).listen(PORT) // определяем слушатель серверного порта на серверном порте

async function checkSessionToken(token) {
  return token === JSON.parse(await fileSystem.readFile('settings.json')).admin_session_token
}

const requestHandlers = {
  '/check-pass.js': async (req, res, url) => {

    let statusCode = 200,
        content = Math.round(Math.random() * new Date())

    fileSystem.readFile('settings.json').then(async fileContent => {
      const settings = JSON.parse(fileContent.toString()),
            pass = settings.admin_page_pass

      if(+url.searchParams.get('pass') !== pass) {
        statusCode = 403
        content = 'invalid password'
      }
      else {
        if(settings.admin_session_token === null) {
          settings.admin_session_token = content
          await fileSystem.writeFile('settings.json', JSON.stringify(settings, 0, 2))
        }
        else content = settings.admin_session_token
        setTimeout(() => {
          fileSystem.readFile('settings.json')
          .then(fileContent => {
            const settings = JSON.parse(fileContent.toString())
            settings.admin_session_token = null
            fileSystem.writeFile('settings.json', JSON.stringify(settings, 0, 2))
          })
        }, settings.admin_page_session_time_limit)
      }
    })
    .catch(err => {
      statusCode = 500
      content = err
    })
    .finally(() => {
      res.writeHead(statusCode, {'Content-Type': 'text/plain'})
      if(content) res.write(content.toString())
      res.end()
    })
  },

  '/admin-page': async (req, res, url) => {

    const sessionToken = JSON.parse((await fileSystem.readFile('settings.json')).toString()).admin_session_token

    if(+url.searchParams.get('session-token') === sessionToken) {
      const pageContent = await fileSystem.readFile('admin-page.html')

      res.writeHead(200, {'Content-Type': 'text/html'})
      res.write(pageContent)
      res.end()
    }
    else {
      res.writeHead(401, {'Content-Type': 'text/html'})
      res.write('<meta charset="utf-8">')
      res.write('<h1>Не авторизовані</h1>')
      res.end()
    }
  },

  '/delete-shopping-item': async (req, res, url) => {

    const sessionToken = JSON.parse((await fileSystem.readFile('settings.json')).toString()).admin_session_token

    if(+url.searchParams.get('session-token') === sessionToken) {
      
      const shoppingItemsFile = JSON.parse((await fileSystem.readFile('shopping_items.json')).toString()),
            deleteItemReqId = +url.searchParams.get('item-id')

      if(shoppingItemsFile.items[deleteItemReqId]) {

        delete shoppingItemsFile.items[deleteItemReqId]
        await fileSystem.writeFile('shopping_items.json', JSON.stringify(shoppingItemsFile, 0, 2))

        res.writeHead(200)
        res.end()
      }
      else {
        res.writeHead(404, {'Content-Type': 'text/html'})
        res.write('<meta charset="utf-8">')
        res.write('<h1>Видаляємий товар не знайдений в базі даних</h1>')
        res.end()
      }
    }
    else {
      res.writeHead(401, {'Content-Type': 'text/html'})
      res.write('<meta charset="utf-8">')
      res.write('<h1>Не авторизовані</h1>')
      res.end()
    }
  },

  '/add-shopping-item': async (req, res, url) => {
    if(req.method !== 'POST') {
      res.writeHead(405, {'Content-Type': 'text/plain'}) // запись кода ответа типа "Метод не разрешён" и формата ответа в виде обычного текста
      res.end('Invalid request') // обозначение что ответ закончен и может быть отправлен
      return
    }

    const sessionToken = JSON.parse((await fileSystem.readFile('settings.json')).toString()).admin_session_token

    if(+url.searchParams.get('session-token') !== sessionToken) {
      res.writeHead(401, {'Content-Type': 'text/html'})
      res.write('<meta charset="utf-8">')
      res.write('<h1>Не авторизовані</h1>')
      res.end()
      return
    }

    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', async () => {

      try {
        const itemId = +new Date()

        body = JSON.parse(body)

        for(const imgObj of body.images) {
          const buffer = new Int8Array(imgObj.content),
                imagesFiles = await fileSystem.readdir('images')

          if(imagesFiles.includes(imgObj.name)) {
            do {
              imgObj.name = imgObj.name.replace(/\.[^.]+$/, '__' + Math.round(Math.random()*10e8) + '__' + '$&')
            } while (imagesFiles.includes(imgObj.name))
          }

          await fileSystem.writeFile('images/' + imgObj.name, buffer)
        }

        const shoppingItemsFile = JSON.parse(await fileSystem.readFile('shopping_items.json'))

        body.reviews = []
        body.rating = null

        body.images.forEach((itm, i, array) => {
          array[i] = '/images/' + itm.name
        })

        shoppingItemsFile.items[itemId] = body

        await fileSystem.writeFile('shopping_items.json', JSON.stringify(shoppingItemsFile, 0, 2))

        res.writeHead(200, {'Content-Type': 'text/plain'})
        res.end(itemId.toString())
      }
      catch(err) {
        res.writeHead(500, {'Content-Type': 'text/plain'})
        res.end(err.toString())
      }
    })
  },

  '/item-page': async (req, res, url) => {
    try {

      let isEditMode = 0

      if(url.searchParams.get('edit-mode')) {
        const sessionToken = JSON.parse(await fileSystem.readFile('settings.json')).admin_session_token
        if(+url.searchParams.get('session-token') !== sessionToken) throw new Error('Unauthorized')
        else isEditMode = 1
      }

      const itemId = +url.searchParams.get('id'),
            item = JSON.parse(await fileSystem.readFile('shopping_items.json')).items[itemId]

      let itemPage = (await fileSystem.readFile('item-page.html')).toString()

      const itemPageBlueprints = new Set(itemPage.match(/{{[^}}]+}}/g))

      for(let blueprint of itemPageBlueprints) {

        const blueprintTag = blueprint.replaceAll(/{|}/g, '')
        let value = ''

        if(blueprintTag === 'item_id') value = itemId
        else if(blueprintTag === 'rating') {
          for(let i = 0; i < 5; i++) {
            if(i < item.rating) value += '★'
            else value += '☆'
          }
        }
        else if(blueprintTag === 'images') {
          for(const imgPath of item.images) {
            value += '<div class="div-image active" style="background-image: url(' + imgPath + ')"></div>'
          }
        }
        else if(blueprintTag === 'price') {
          if(!item.discount)  value = '<span id="item-price" class="price-number">' + item.price + '</span> ₴'
          else {
            value = '<s><span class="price-number">' + item.price + '</span> ₴</s>'
            value += '<mark class="discounted-price"><span id="item-price">' + item.price * (100 - item.discount) / 100 + '</span> ₴</mark>'
          }
        }
        else if(blueprintTag === 'characteristics') {
          for(const id in item.characteristics) {
            const characObj = item.characteristics[id]
            value += '<span>' + characObj.name + '</span> : <span>' + characObj.value + '</span><br>'
          }
        }
        else if(blueprintTag === 'reviews') {

          value = []

          for(const review of item.reviews) {

            const rating = []

            for(let i = 0; i < 5; i++) {
              if(i < +review.rating) rating.push('★')
              else rating.push('☆')
            }

            value.unshift(`
              <div class="reviews-review">
                <div class="review-header">
                  <div class="name-side">
                    <p class="name">${review['user-name'] || 'Невідомий'} ${review['user-surname'] || ''}</p>
                    <p class="review-rating">${rating.join('')}</p>
                  </div>
                  <div class="date-side">${new Date(+review.time).toLocaleDateString()}</div>
                </div>
                <div class="review-content">${review.review}</div>
              </div>
            `)
          }

          value = value.join('')
        }
        else if(blueprintTag === 'reviews_count') value = item.reviews.length
        else if(isEditMode && blueprintTag === 'admin-tools') {
          value = await fileSystem.readFile('item-page-editing.html')
        }
        else if(isEditMode && blueprintTag === 'admin-tools-script') value = '<script src="item_page_edit.js"></script>'
        else value = item[blueprintTag] || ''

        itemPage = itemPage.replaceAll(blueprint, value)
      }

      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end(itemPage)
    }
    catch(err) {
      res.writeHead(500, {'Content-Type': 'text/plain'})
      res.end(err.toString())
    }
  },

  '/create-account': async (req, res, url) => {
    try {

      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', async () => {

        try {
          const accounts = JSON.parse(await fileSystem.readFile('accounts.json'))
          
          let accountId = Math.round(Math.random()*10e8)

          for(let i = 0; i < 10; i++) {
            if(accounts[accountId]) accountId = Math.round(Math.random()*10e8)
            else break
          }

          if(accounts[accountId]) throw new Error('too many accounts id, can\'t create new id')

          body = JSON.parse(body)
          accounts[accountId] = {}

          for(const prop in body) accounts[accountId][prop] = body[prop]

          await fileSystem.writeFile('accounts.json', JSON.stringify(accounts, 0, 2))

          res.writeHead(200)
          res.end()
        }
        catch(err) {          
          res.writeHead(500)
          res.end(err.toString())
        }
      })
    }
    catch(err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },

  '/sign-in-account': async (req, res, url) => {
    try {

      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', async () => {
        try {

          const accounts = JSON.parse(await fileSystem.readFile('accounts.json'))
          let accountId = ''

          body = JSON.parse(body)

          for(const accId in accounts) {
            if(accounts[accId].email === body.email) {
              if(accounts[accId].pass === body.pass) {
                accountId = accId
                break
              }
            }
          }

          if(accountId === '') {
            res.writeHead(404)
            res.end()
            return
          }
          
          res.writeHead(200)
          res.end(accountId)
        }
        catch(err) {
          res.writeHead(500)
          res.end(err.toString())
        }
      })
    }
    catch(err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },

  '/get-account': async (req, res, url) => {
    try {

      const accountId = url.searchParams.get('id'),
            accountObj = JSON.parse(await fileSystem.readFile('accounts.json'))[accountId]

      res.writeHead(200, {'Content-Type': 'application/json'})
      res.end(JSON.stringify(accountObj))
    }
    catch(err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },

  '/delete-account': async (req, res, url) => {
    try {

      const accountId = url.searchParams.get('id')

      let accountsFileString = (await fileSystem.readFile('accounts.json')).toString()      
      accountsFileString = accountsFileString.replace(new RegExp(`"${accountId}[^}]+},\n  `), '')

      await fileSystem.writeFile('accounts.json', accountsFileString)

      res.writeHead(200)
      res.end()
    }
    catch(err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },

  '/set-account-properties': async (req, res, url) => {
    try {

      const accountId = url.searchParams.get('id'),
            accountsFile = JSON.parse(await fileSystem.readFile('accounts.json'))

      url.searchParams.delete('id')

      for(const [key, value] of url.searchParams.entries()) {
        accountsFile[accountId][key] = value
      }

      await fileSystem.writeFile('accounts.json', JSON.stringify(accountsFile, 0, 2))

      res.writeHead(200)
      res.end()
    }
    catch(err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },

  '/add-item-review': async (req, res, url) => {
    try {

      const itemId = url.searchParams.get('id')

            url.searchParams.delete('id')

      const shoppingItemsFile = JSON.parse(await fileSystem.readFile('shopping_items.json')),
            shoppingItem = shoppingItemsFile.items[itemId],
            reviewItem = {}

      for(const [key, value] of url.searchParams.entries()) {
        reviewItem[key] = value
      }

      shoppingItem.reviews.push(reviewItem)

      const averageRating = shoppingItem.reviews.reduce((summ, itm) => summ + +itm.rating, 0) / shoppingItem.reviews.length
      shoppingItem.rating = Math.round(averageRating)

      await fileSystem.writeFile('shopping_items.json', JSON.stringify(shoppingItemsFile, 0, 2))

      res.writeHead(200)
      res.end()
    }
    catch(err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },
  
  '/get-item': async (req, res, url) => {
    try {

      const itemId = url.searchParams.get('id'),
            itemObj = JSON.parse(await fileSystem.readFile('shopping_items.json')).items[itemId]

      if(itemObj === undefined) {
        res.writeHead(404)
        res.end()
        return
      }

      res.writeHead(200)
      res.end(JSON.stringify(itemObj))
    }
    catch(err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },

  '/set-item': async (req, res, url) => {
    try {

      const itemId = url.searchParams.get('id'),
            itemsFile = JSON.parse(await fileSystem.readFile('shopping_items.json'))

      url.searchParams.delete('id')

      for(const [key, value] of url.searchParams.entries()) {
        itemsFile.items[itemId][key] = isNaN(value) ? value : +value
      }

      await fileSystem.writeFile('shopping_items.json', JSON.stringify(itemsFile, 0, 2))

      res.writeHead(200)
      res.end()
    }
    catch(err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },

  '/get-categories': async (req, res, url) => {
    try {
      
      if(req.method !== 'GET') throw new Error('Bad request method')

      const categories = JSON.parse(await fileSystem.readFile('shopping_items.json')).categories

      res.setHeader('Content-Type', 'application/json')
      res.writeHead(200)
      res.end(JSON.stringify(categories))
    }
    catch (err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },

  '/add-category': async (req, res, url) => {
    try {
    
      if(req.method !== 'GET') throw new Error('Bad request method')
      const category = url.searchParams.get('category'),
            sessionToken = url.searchParams.get('sessionToken')

      if(!category || await checkSessionToken(sessionToken)) throw new Error('Invalid category or token')

      const shoppingItemsFile = JSON.parse(await fileSystem.readFile('shopping_items.json'))

      shoppingItemsFile.categories.push(category)

      await fileSystem.writeFile('shopping_items.json', JSON.stringify(shoppingItemsFile, 0, 2))

      res.writeHead(200)
      res.end()
    }
    catch (err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },

  '/delete-category': async (req, res, url) => {
    try {
      if(req.method !== 'GET') throw new Error('Bad request method')

      const category = url.searchParams.get('category'),
            sessionToken = url.searchParams.get('sessionToken')

      if(!category || await checkSessionToken(sessionToken)) throw new Error('Invalid category or token')

      const shoppingItemsFile = JSON.parse(await fileSystem.readFile('shopping_items.json'))

      const categoryIndex = shoppingItemsFile.categories.findIndex(itm => itm === category)

      if(categoryIndex === -1) throw new Error('Category not exist')

      shoppingItemsFile.categories.splice(categoryIndex, 1)

      await fileSystem.writeFile('shopping_items.json', JSON.stringify(shoppingItemsFile, 0, 2))

      res.writeHead(200)
      res.end()
    }
    catch (err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },
  
  '/recover-pass-request': async (req, res, url) => {
    try {
      if(req.method !== 'GET') throw new Error('Bad request method')

      const email = url.searchParams.get('email'),
            accounts = JSON.parse(await fileSystem.readFile('accounts.json'))

      let accountId = null

      for(const id in accounts) {
        if(accounts[id].email === email) {
          accountId = id
          break
        }
      }

      if(accountId === null) {
        res.writeHead(404)
        res.end()
        return
      }

      const tempToken = (Math.random() * new Date()).toString(32),
            settingsFile = JSON.parse(await fileSystem.readFile('settings.json'))
      
      function makeTimeout() {
        return setTimeout(async () => {
          try {
            delete settingsFile.recovery_pass_tokens[accountId]
            fileSystem.writeFile('settings.json', JSON.stringify(settingsFile, 0, 2))
          }
          catch(err) {
            console.log(err)
          }
        }, settingsFile.recovery_pass_time_limit)
      }

      if(settingsFile.recovery_pass_tokens[accountId] === undefined) {

        settingsFile.recovery_pass_tokens[accountId] = tempToken
        await fileSystem.writeFile('settings.json', JSON.stringify(settingsFile, 0, 2))

        recoveryPassTimeouts[accountId] = makeTimeout()
      }
      else {
        clearTimeout(recoveryPassTimeouts[accountId])
        settingsFile.recovery_pass_tokens[accountId] = tempToken
        await fileSystem.writeFile('settings.json', JSON.stringify(settingsFile, 0, 2))
        recoveryPassTimeouts[accountId] = makeTimeout()
      }

      sendMail(email, 'Відновлення паролю', `
        Посилання на відновлення паролю:
        ${config.website}/new-pass?account-id=${accountId}&temp-token=${tempToken}

        Воно буде працювати 6 годин після запиту відновлення паролю
      `)
      
      res.writeHead(200)
      res.end()
    }
    catch (err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },

  '/set-new-pass': async (req, res, url) => {
    try {
      if(req.method !== 'GET') throw new Error('Bad request method')

      const accountId = url.searchParams.get('account-id'),
            tempToken = url.searchParams.get('temp-token'),
            pass = url.searchParams.get('pass'),
            recovery_pass_tokens = JSON.parse(await fileSystem.readFile('settings.json')).recovery_pass_tokens[accountId],
            accountsFile = JSON.parse(await fileSystem.readFile('accounts.json'))

      if(tempToken === recovery_pass_tokens) {
        accountsFile[accountId].pass = pass
        await fileSystem.writeFile('accounts.json', JSON.stringify(accountsFile, 0, 2))
        res.writeHead(200)
        res.end()
      }
      else {
        throw new Error('Invalid recovery pass token')
      }
    }
    catch (err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },

  '/make-buy-request': async (req, res, url) => {
    try {
      if(req.method !== 'POST') throw new Error('Bad request method')

      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', async () => {

        const {account_id, cart} = JSON.parse(body),
              accountsFile = JSON.parse(await fileSystem.readFile('accounts.json')),
              accountObj = accountsFile[account_id]

        // body = {
        //   account_id: account_id,
        //   cart: {
        //     id: {
        //       title,
        //       count,
        //       price
        //     },
        //     ...
        //   }
        // }

        if(accountObj === undefined) {
          res.writeHead(400)
          res.end('Account not exist')
          return
        }

        const cartLength = Object.keys(cart).length

        if(cartLength <= 0) {
          res.writeHead(400)
          res.end('Cart haven\'t items')
          return
        }

        if(!accountObj.orders) accountObj.orders = []

        const orderIndex = accountObj.orders.push({
                id: account_id + '-' + (new Date() * Math.random()).toString(36),
                status: 'ВІДКРИТИЙ',
                cart: cart
              }) - 1,
              order = accountObj.orders[orderIndex]

        await fileSystem.writeFile('accounts.json', JSON.stringify(accountsFile, 0, 2))

        let html = '<h2 style="margin-bottom: 10px">Нове замовлення з магазину товарів:</h2>',
            finalPrice = 0

        for(const id in order.cart) {
          const item = order.cart[id]
          html += `
            <h3 style="margin: 0; margin-bottom: 10px">Назва товару:</h3>
            <p style="margin: 0; margin-bottom: 5px"><strong>${item.title}</strong></p>
            <p style="margin: 0; margin-bottom: 10px">Кількість: ${item.count}, Ціна: ${item.price * item.count}₴ (${item.price}₴ за одиницю товару)</p>
          `

          if(cartLength !== 1) finalPrice += item.price * item.count
        }

        if(cartLength !== 1) html += '<h3 style="margin-top: 0; margin-bottom: 10px">Остаточна ціна: ' + finalPrice + ' ₴</h3>'

        html += `
          <h2 style="margin-top: 30px; margin-bottom: 10px">Дані замовника:</h2>
          <p style="margin-top: 0">
            Id: ${account_id}, ${accountObj.name} ${accountObj.surname} &lt;${accountObj.email}&gt;<br>
            Адреса: ${accountObj.address}
          </p>
        `

        sendMail(config.user, 'Замовлення з Магазину Товарів', html)

        res.setHeader('Content-Type', 'application/json')
        res.writeHead(200)
        res.end(JSON.stringify(accountObj))
      })
    }
    catch (err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  },

  '/change-order-status': async (req, res, url) => {
    try {
      const account_id = url.searchParams.get('account-id'),
            order_id = url.searchParams.get('order-id'),
            status = decodeURI(url.searchParams.get('status')),
            accountsFile = JSON.parse(await fileSystem.readFile('accounts.json')),
            order = accountsFile[account_id].orders.find(order => order.id === order_id)

      if(status === 'ВІДКРИТИЙ' || status === 'В ПРОЦЕСІ' || status === 'ЗАКРИТИЙ' || status === 'СКАСОВАНИЙ') {
        order.status = status
        await fileSystem.writeFile('accounts.json', JSON.stringify(accountsFile, 0, 2))
        
        res.writeHead(200)
        res.end(JSON.stringify(order))
      }
      else {
        throw new Error('Invalid order status')
      }
    }
    catch (err) {
      res.writeHead(500)
      res.end(err.toString())
    }
  }
}

const recoveryPassTimeouts = {}