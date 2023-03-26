
import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch';


export class eventsOnHistory extends plugin {
  constructor() {
    super({
      name: '历史上的今天',
      dsc: '历史上的今天',
      event: 'message',
      priority: 1000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#历史上的今天$",
          /** 执行方法 */
          fnc: 'eventsOnHistory'
        }
      ]
    })
  }


  async eventsOnHistory(e) {
    const month = (new Date().getMonth() + 1) < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`
    const day = (new Date().getDate()) < 10 ? `0${new Date().getDate()}` : `${new Date().getDate()}`
    console.log(month, day);
    const res = await fetch(`https://baike.baidu.com/cms/home/eventsOnHistory/${month}.json`)
    const jsn = await res.text()
    const eventList = JSON.parse(jsn)
    // console.log(eventList[month]);
    if (eventList[month]) {
      let msg = ``
      const reg = /\<(.+?)\>/gm
      const list = eventList[month][`${month}${day}`]
      list.reverse().map((event, index) => {
        event.title = event.title.replace(reg, '')
        msg += `\n${index + 1}.${event.title}`
      })
      e.reply(`历史上的今天：${msg}`)
    } else {
      e.reply(`数据获取失败`)
    }
    return true
  }
}