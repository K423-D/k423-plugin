import plugin from '../../../lib/plugins/plugin.js'
import { segment } from 'oicq'
import fetch from 'node-fetch';

export class baidubaike extends plugin {
  constructor() {
    super({
      name: 'baidubaike',
      dsc: '百度百科',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      priority: 1000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#*百科(.*)$",
          /** 执行方法 */
          fnc: 'baidubaike'
        }
      ]
    })
  }

  async baidubaike(e) {
    // if (!false)
    //   if (e.isPrivate && !e.isMaster) {
    //     return true;
    //   }
    let msg = e.msg;
    msg = msg.replace(/#|百科/g, "").trim();
    if (!msg) return;

    let url = `http://ovooa.com/API/bdbk/?Msg=${msg}`;
    let response = await fetch(url);
    let r = await response.text();
    r.replace('json:', '')
    let res = {}
    try {
      res = JSON.parse(r)
    } catch (error) {
      e.reply(error);
      return true
    }
    if (res.code == -2) {
      e.reply("百度百科暂未收录词条“" + msg + "”");
      return true
    }
    if (res.code == -1) {
      e.reply("请输入需要百科的内容");
      return true
    }
    if (res.code != 1) {
      e.reply("未知错误，请联系开发者反馈");
      return true
    }
    msg = [
      // "【",segment.text(res.data.Msg),"】",
      segment.image(res.data.image),
      segment.text(res.data.info), "\n",
      "详情：", segment.text(res.data.url)
    ];
    e.reply(msg);
    return true; //返回true 阻挡消息不再往下
  }
}