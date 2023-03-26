import plugin from '../../../lib/plugins/plugin.js'
import cfg from '../../../lib/config/config.js'
import fetch from "node-fetch";


//百度cookie
let Cookie = `BIDUPSID=5B185FC95C55D15593F5EEED39601A13; PSTM=1647512336; BAIDUID=5B185FC95C55D1551CE17453667DF628:FG=1; BD_HOME=1; BAIDUID_BFESS=5B185FC95C55D15593F5EEED39601A13:FG=1; delPer=0; BD_CK_SAM=1; PSINO=6; H_PS_PSSID=35839_35105_34812_35914_34584_36120_36073_35801_35956_35984_35315_26350_35869_36102_36061; BD_UPN=12314753; H_PS_645EC=92905V%2F0hWUAIIGp7T2M3winhJDTgoNCQDeWJmq5BH78u6rMWIUhIz1yAfI; BA_HECTOR=0h8k052k8l0g010k3t1h362og0q; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; channel=baidusearch; baikeVisitId=0fb26460-c7e9-4096-90fa-eda92aa90ae3`;
//短连接token
let token = "";

export class baidu extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: 'baidu',
      /** 功能描述 */
      dsc: '百度搜索',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#*百度(.*)$",
          /** 执行方法 */
          fnc: 'baidu'
        }
      ]

    })
  }

  async baidu(e) {
    let msg = e.msg;
    if (e.img) {
      // return baiduImg(e);
    }
    else if (e?.at == cfg.qq) {
      msg = "#" + e.msg.replace(/#/g, "");
    } else if (e.hasReply) {
      msg = "#" + e.source.message;
    }

    if (msg == "#百度" || msg == "#百度一下") {
      msg = "百度一下";
    } else {
      if (!msg.includes("#")) {
        return;
      }
      msg = msg.replace(/#|百度|一下/g, "").trim();
    }

    if (!msg) return;

    if (!Cookie) {
      e.reply("请先配置cookie");
      return;
    };

    let url = `https://www.baidu.com/s?ie=UTF-8&wd=${encodeURI(msg)}&cl=3`;
    let headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
      "Host": "www.baidu.com",
      "Connection": "keep-alive",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "Cookie": Cookie
    };
    let response = await fetch(url, { method: "get", headers: headers });

    if (!response.ok) {
      Bot.logger.mark(`百度${msg}失败`);
      return;
    }
    let res = await response.text();

    let text = res.match(/c-container"><!--s-data(.*)}-->/g);

    if (!text || text?.length <= 0) {
      e.reply("没有搜索到相关内容");
      return true;
    }

    text = text[0].replace(/c-container"><!--s-data:|-->/g, "").trim();
    let title = "", titleUrl = "", contentText = "";
    try {
      res = JSON.parse(text)
      title = res.title;
      contentText = res.contentText || '';
      titleUrl = res.titleUrl;
    } catch (error) {
      title = text.match(/"title":"[^"]*/);
      titleUrl = text.match(/"titleUrl":"[^"]*/);
      title = title[0].replace(/"title":"/g, "");
      titleUrl = titleUrl[0].replace(/"titleUrl":"/g, "");
    }
    title = title.replace(/<em>|<\/em>/g, "").trim();
    contentText = contentText.replace(/<em>|<\/em>/g, "").trim();
    // if (token) {
    //   titleUrl = await dwz(titleUrl);
    // }

    msg = `${title}\n\n`;
    if (contentText) {
      msg += `${contentText}\n`;
    }
    msg += `${titleUrl}`;

    e.reply(msg);

    return true; //返回true 阻挡消息不再往下
  }
}