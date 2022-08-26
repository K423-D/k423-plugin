import plugin from '../../../lib/plugins/plugin.js'
import { segment } from 'oicq'
import lodash from 'lodash'


export class fakerMsg extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: '制作转发信息',
      /** 功能描述 */
      dsc: '制作转发信息',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#fakeMsg:",
          /** 执行方法 */
          fnc: 'fakeMsg'
        }
      ]

    })
  }

  /**
   * 
   * @param e oicq传递的事件参数e
   */
  async fakeMsg(e) {
    // console.log(e.message);
    console.log(e);
    if (!e.isMaster) {
      let msg = [
        "打咩.jpg"
      ]
      e.reply(msg);
      return false;
    }
    const isCorrectFormat = e.message.length === 3 && e.message[1].type === 'at' && e.message[2].type === 'text'
    if (isCorrectFormat) {
      const msgList = e.message[2].text.split('|')
      const title = msgList[0]

      msgList.map(msg => {
        msg = `${msg}\n`
      })
      const end = ''
      let forwardMsg = await this.makeForwardMsg(e.message[1].qq, title, msgList, end)
      e.reply(forwardMsg)
    } else {
      let msg = [
        "格式错误！"
      ]
      e.reply(msg);
      return false;
    }
  }

  async makeForwardMsg(qq, title, msg, end = '') {
    let userInfo
    if (this.e.isGroup) {
      let info = await Bot.getGroupMemberInfo(this.e.group_id, qq)
      // console.log(info);
      userInfo = {
        user_id: info.user_id,
        nickname: info.nickname
      }
    }
    let forwardMsg = [
      // {
      //   ...userInfo,
      //   message: title
      // }
    ]

    let msgArr = lodash.chunk(msg, 40)
    msgArr.forEach(v => {
      v[v.length - 1] = lodash.trim(v[v.length - 1], '\n')
      forwardMsg.push({ ...userInfo, message: v })
    })

    if (end) {
      forwardMsg.push({ ...userInfo, message: end })
    }

    /** 制作转发内容 */
    if (this.e.isGroup) {
      forwardMsg = await this.e.group.makeForwardMsg(forwardMsg)
    } else {
      forwardMsg = await this.e.friend.makeForwardMsg(forwardMsg)
    }

    /** 处理描述 */
    forwardMsg.data = forwardMsg.data
      .replace(/\n/g, '')
      .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
      .replace(/___+/, `<title color="#777777" size="26">${title}</title>`)

    return forwardMsg
  }
}

