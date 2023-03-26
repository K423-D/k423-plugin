// 编写者：（▼へ▼メ）
// 做了点微小的改动
import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch';

export class cqyl extends plugin {
  constructor() {
    super({
      name: '超强语录',
      dsc: '超强语录',
      event: 'message',
      priority: 1000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^\s*#语录",
          /** 执行方法 */
          fnc: 'cqyl'
        }
      ]
    })
  }


  async cqyl(e) {
    const hp = /^\s*#语录\s*$/
    const hpt = "格式：<#语录><类型>\n类型：\n土味情话\n精神语录\n网易云热评\n成人笑话\n奇葩对话\n舔狗日记\n毒鸡汤\n朋友圈文案\n骂人宝典\n动画\n漫画\n游戏\n文学\n原创\n来自网络\n其他\n影视\n诗词\n网易云\n哲学\n抖机灵"
    const ex = "1001土味情话1002精神语录1003网易云热评1004成人笑话1005奇葩对话1006舔狗日记1007毒鸡汤1008朋友圈文案1009骂人宝典2001动画2002漫画2003游戏2004文学2005原创2006来自网络2007其他2008影视2009诗词2010网易云2011哲学2012抖机灵"

    if (hp.test(e.msg)) {
      e.reply(hpt)
    } else {
      const t = e.msg.replace(/^\s*#语录|\s/g, "")
      let c = ex.match(new RegExp("\\d+" + t))
      if (c != null) {
        c = c.toString().replace(/(\d+).+/, "$1")
        const ret = await fetch(`https://api.oddfar.com/yl/q.php?c=${c}&encode=json`)
        const jsn = await ret.json()
        if (jsn != null && jsn.code == "200" && jsn.msg == "success" && jsn.type == c && jsn.text != null) {
          e.reply(jsn.text.replace(new RegExp("<br>", "gm"), "\n"))
        } else {
          e.reply("（▼へ▼メ）")
        }
      } else {
        e.reply(`没有找到此类型(${t})的相关语录。`)
      }
    }
    return true
  }

}

