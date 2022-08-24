import fs from 'node:fs'
import common from '../../lib/common/common.js'

const files = fs.readdirSync('./plugins/k423-plugin/apps').filter(file => file.endsWith('.js'))

let list = []

files.map(file => {
  list.push(import(`./apps/${file}`))
})

list = await Promise.allSettled(list)

let apps = {}
for (let i = 0; i < list.length; i++) {
  const name = files[i].replace('.js', '')

  if (list[i].status !== 'fulfilled') {
    logger.error(`插件${logger.red(name)}载入错误！`)
    logger.error(list[i].reason)
    continue
  }

  apps[name] = list[i].value[name]
}

logger.info('=============================')
logger.info('k423-plugin <v0.1.0> 加载完成~')
logger.info('=============================')

let restart = await redis.get(`Yunzai:k423-plugin:restart`)
if (restart) {
  restart = JSON.parse(restart)
  if (restart.isGroup) {
    Bot.pickGroup(restart.id).sendMsg(`重启成功`)
  } else {
    common.relpyPrivate(`${restart.id} 重启成功`)
  }
  redis.del(`Yunzai:k423-plugin:restart`)
}

export { apps }