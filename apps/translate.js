import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch';
import MD5 from '../utils/md5.js';


export class translate extends plugin {
  constructor() {
    super({
      name: '百度翻译',
      dsc: '百度翻译',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      priority: 1000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#翻译",
          /** 执行方法 */
          fnc: 'translate'
        }
      ]
    })
  }
  genSign(data) {
    const secret = 'G9bqL2z3PPt7qnirR6nd'
    const s = `${data.appid}${data.q}${data.salt}${secret}`
    // console.log(s);
    return MD5(s)
    // return MD5('2015063000000001apple143566028812345678')
  }


  async translate(e) {
    const str = e.msg.replace('#翻译', '')
    // const data = {
    //   q: 'apple',
    //   from: 'en',
    //   to: 'zh',
    //   appid: 2015063000000001,
    //   salt: 1435660288,
    // }
    const data = {
      q: str,
      from: 'en',
      to: 'zh',
      appid: 20220908001335899,
      salt: 18200193133,
    }
    const sign = this.genSign(data)
    data.q = encodeURI(data.q)
    data.sign = sign
    // console.log(data);
    const res = await fetch(`https://fanyi-api.baidu.com/api/trans/vip/translate`, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      headers: {
        // 'Content-Type': 'application/json'
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data // body data type must match "Content-Type" header
      // body: JSON.stringify(data) // body data type must match "Content-Type" header
    })
    const jsn = await res.json()
    // console.log(jsn);
    if (jsn.trans_result) {
      e.reply(`翻译结果：${jsn.trans_result[0].dst}`)
    } else {
      e.reply(`错误码：${jsn.error_code}\n错误信息：${jsn.error_msg}`)
    }
    return true
  }
}