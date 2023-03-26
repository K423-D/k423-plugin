import plugin from '../../../lib/plugins/plugin.js'
import fetch from 'node-fetch';
// import request from 'superagent';

export class vilg extends plugin {
  constructor() {
    super({
      name: 'vilg',
      dsc: 'vilg',
      event: 'message',
      priority: 1000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#*vilgStyle$",
          /** 执行方法 */
          fnc: 'vilgStyle'
        },
        {
          /** 命令正则匹配 */
          reg: "^#*vilg(.*)$",
          /** 执行方法 */
          fnc: 'vilg'
        }
      ]
    })
  }

  async vilg(e) {
    let msg = []
    let result = {}
    const data = e.msg.replace('#vilg', '').split('|')
    // console.log(data);
    // 获取accessToken
    if (data.length === 0) {
      e.reply(['请检查命令格式']);
    }
    const accessToken = await this.getAccessToken()
    if (data.length <= 1) {
      const r1 = await this.textToImg(data[0], 1, accessToken)
      result = r1
    } else {
      const r2 = await this.textToImg(data[0], data[1], accessToken)
      result = r2
    }
    msg = [`${result.code}\n${result.msg}\n${JSON.stringify(result.data)}`]
    // msg = [
    //   // accessToken,
    //   // "【",segment.text(res.data.Msg),"】",
    //   // segment.image(res.data.image),
    //   // segment.text(res.data.info), "\n",
    //   // "详情：", segment.text(res.data.url)
    // ];
    if (result?.data?.taskId) {
      e.reply(['生成图片中...一分钟后获取结果']);
      this.getResultImg(e, accessToken, result.data.taskId, data[0], data[1] ? data[1] : 1)
    } else {
      e.reply(msg);
    }
    return true; //返回true 阻挡消息不再往下
  }
  // 获取accessToken
  async getAccessToken() {
    const apiKey = 'gxVkC59VRGRcsepTYZzxDEQsr1QPbi8x'
    const secret = 'D9LCvGMMg1mksoW12o5921YkX1S7d96p'
    const res = await fetch(`https://wenxin.baidu.com/moduleApi/portal/api/oauth/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secret}`, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      headers: {
        // 'Content-Type': 'application/json'
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    const json = await res.json()
    return json.code === 0 ? json.data : false
  }
  // 提交请求
  async textToImg(text, style, accessToken) {
    // console.log(text, style, accessToken);
    const styleMap = {
      1: '油画',
      2: '水彩',
      3: '卡通',
      4: '粉笔画',
      5: '儿童画',
      6: '蜡笔画',
    }
    const data = {
      text,
      style: styleMap[style]
    }
    const res = await fetch(`https://wenxin.baidu.com/moduleApi/portal/api/rest/1.0/ernievilg/v1/txt2img?access_token=${accessToken}`, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      headers: {
        // 'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify(data)
    })
    const json = await res.json()
    // console.log(json);
    return json
  }
  // 获取
  async getResultImg(e, access_token, taskId, text, style) {
    const styleMap = {
      1: '油画',
      2: '水彩',
      3: '卡通',
      4: '粉笔画',
      5: '儿童画',
      6: '蜡笔画',
    }
    const timeout = setTimeout(async () => {
      const data = {
        access_token,
        taskId
      }
      const res = await fetch(`https://wenxin.baidu.com/moduleApi/portal/api/rest/1.0/ernievilg/v1/getImg?access_token=${access_token}`, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
          // 'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(data)
      })
      const json = await res.json()
      // console.log(json);
      if (json.msg === 'success') {
        // e.reply([JSON.stringify(json.data.imgUrls)])
        e.reply([`文本：${text}\n`, `风格：${styleMap[style]}\n`, segment.image(json.data.img)])
      } else {
        e.reply([`文本：${text}\n`, `风格：${styleMap[style]}\n`, `图片获取失败\n${json.msg}`])
      }
      clearTimeout(timeout)
    }, 60 * 1000);
  }
  // vilgStyle
  vilgStyle(e) {
    const styles = `1.油画\n2.水彩画\n3.卡通\n4.粉笔画\n5.儿童画\n6.蜡笔画`
    e.reply(styles)
    return true
  }
}