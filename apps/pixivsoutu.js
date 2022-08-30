
import { createRequire } from 'module'
import { segment } from "oicq";
import plugin from '../../../lib/plugins/plugin.js'

//v2.2由一葉修改，后续修改者请标号注释
//v2.3添加p外danbooro源的识别
//v2.4添加kemono中fanbox识别,根据行歌的思路初步修复.data字段报错问题
//如果搜图发现没有出处或者是undefined，可以把所搜图片发与一葉添加识别或者自行添加识别
//必看：必须先填写下面的api_key ！！！！！！！！！！


export class pixivsoutu extends plugin {
  soutuUser = {}

  constructor() {
    super({
      /** 功能名称 */
      name: 'saucenao.com 搜图',
      /** 功能描述 */
      dsc: '【搜图】带上图',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 10,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^#*搜图$",
          /** 执行方法 */
          fnc: 'presoutu'
        },
        // {
        //   /** 命令正则匹配 */
        //   reg: "",
        //   /** 执行方法 */
        //   fnc: 'soutu'
        // }
      ]

    })
    this.soutuUser = {}
  }

  //presoutu为分离发送图片和计时的代码块
  async presoutu(e) {

    if (e.hasReply) {
      let reply = (await e.group.getChatHistory(e.source.seq, 1)).pop()?.message;
      if (reply) {
        for (let val of reply) {
          if (val.type == "image") {
            e.img = [val.url];
            break;
          }
        }
      }
    }

    if (!e.img) {
      // if (this.soutuUser[e.user_id]) {
      //   clearTimeout(this.soutuUser[e.user_id]);
      // }
      // this.soutuUser[e.user_id] = setTimeout(() => {
      //   if (this.soutuUser[e.user_id]) {
      //     delete this.soutuUser[e.user_id];
      //     e.reply([segment.at(e.user_id), " 搜图已取消"]);
      //   }
      // }, 50000);

      e.reply([segment.at(e.user_id), " 请带上图片"]);
      return false;
    }

    this.soutuUser[e.user_id] = true;
    return this.soutu(e);
  }

  async soutu(e) {
    try {
      if (!this.soutuUser[e.user_id]) return;

      if (!e.img) {
        this.cancel(e);
        return true;
      }
      let api_key = '13f91b601836c976e7cae9e25639d048e2946ae5';//api_key只要填进这里

      //阻拦除主人外的私聊
      /*let panduan = null;
      if (e.isGroup) {
          panduan = e.group;
      } else if (e.isMaster) {
          panduan = e.friend;
      } else {
          let msg = [
              "此功能不支持私聊嗷~"
          ]
          e.reply(msg);
          return false;
      }*/
      //api_key验证
      if (api_key == '') {
        let msg = [
          "请自行去saucenao.com注册账号并获取api_key！"
        ]
        e.reply(msg);
        return false;
      }

      /*
      if (e.img == null) {
          let msg = [
              segment.at(e.user_id), '\n',
              "请在同一条消息内发送搜图和图片。"]
          e.reply(msg);
          return false;
      }*/

      let imgURL = e.img[0];
      let url;
      if (imgURL.length > 0) {
        url = "https://saucenao.com/search.php";
      }

      const require = createRequire(import.meta.url)
      const axios = require('axios')

      const response = await axios.get(url, {
        params: {
          url: imgURL,
          db: 999,
          api_key: api_key,
          output_type: 2,
          numres: 3
        }
      })

      const res = response.data;
      const short_remaining = res.header.short_remaining;//30s内剩余搜图次数
      const long_remaining = res.header.long_remaining;//一天内剩余搜图次数

      let penable = false;
      let jp = false;
      let danb = false;
      let pother = false;
      let k = 0;

      //优先p站源，其次danbooru，再其次携带日文名，最后是其他
      if (res) {
        let i = 0;
        for (i; i < 3; i++) {
          if (res.results[i].data.pixiv_id) { penable = true; k = i; break; }
          else if (res.results[i].data.ext_urls) {
            for (let j = 0; j < res.results[i].data.ext_urls.length; j++) {
              if (res.results[i].data.ext_urls[j].indexOf('pixiv') != -1) {
                pother = true; k = i; break;
              }
              if (pother) { break; }
            }
          }
          else if (res.results[i].data.ext_urls) {
            for (let j = 0; j < res.results[i].data.ext_urls.length; j++) {
              if (res.results[i].data.ext_urls[j].indexOf('danbooru') != -1) {
                danb = true; k = i; break;
              }
              if (danb) { break; }
            }
          }
          else if (res.results[i].data.jp_name) { jp = true; k = i; break; }
          else { penable = false; k = 0; }
        }
      }

      //过滤相似度<=70%的图片，并返回首张图片
      if (res.results[k].header.similarity <= 70) { k = 0; }

      let msg;

      if (penable) {
        //p中danbooru源
        let pdanb = false;
        if (res.results[k].data.ext_urls) {
          for (let j = 0; j < res.results[k].data.ext_urls.length; j++) {
            if (res.results[k].data.ext_urls[j].indexOf('danbooru') != -1)
              pdanb = true; break;
          }
        }
        if (pdanb) {
          msg = [segment.at(e.user_id), '\n',
          "相似度：" + res.results[k].header.similarity + "%\n",
          "danbooru_id：" + (res.results[k].data.danbooru_id ? res.results[k].data.danbooru_id : ''), '\n',
          "gelbooru_id：" + (res.results[k].data.gelbooru_id ? res.results[k].data.gelbooru_id : ''), '\n',
          "creator：" + (res.results[k].data.creator ? res.results[k].data.creator : ''), '\n',
          "material：" + (res.results[k].data.material ? res.results[k].data.material : ''), '\n',
          "characters：" + (res.results[k].data.characters ? res.results[k].data.characters : ''), '\n',
          "来源：" + (res.results[k].data.source ? res.results[k].data.source : ''), '\n',
          "链接：" + res.results[k].data.ext_urls[0], '\n',
          segment.image(res.results[k].header.thumbnail), '\n',
          "一天内还可搜索" + long_remaining + "次"
          ]
        }
        //p站源
        else {
          msg = [segment.at(e.user_id), '\n',
          "相似度：" + res.results[k].header.similarity + "%\n",
          "标题：" + (res.results[k].data.title ? res.results[k].data.title : ''), '\n',
          "P站ID：" + (res.results[k].data.pixiv_id ? res.results[k].data.pixiv_id : ''), '\n',
          "画师：" + (res.results[k].data.member_name ? res.results[k].data.member_name : ''), '\n',
          "来源：" + res.results[k].data.ext_urls[0], '\n',
          segment.image(res.results[k].header.thumbnail), '\n',
          "一天内还可搜索" + long_remaining + "次"
          ];
        }
      }
      else if (danb) {
        msg = [segment.at(e.user_id), '\n',
        "相似度：" + res.results[k].header.similarity + "%\n",
        "danbooru_id：" + (res.results[k].data.danbooru_id ? res.results[k].data.danbooru_id : ''), '\n',
        "gelbooru_id：" + (res.results[k].data.gelbooru_id ? res.results[k].data.gelbooru_id : ''), '\n',
        "creator：" + (res.results[k].data.creator ? res.results[k].data.creator : ''), '\n',
        "material：" + (res.results[k].data.material ? res.results[k].data.material : ''), '\n',
        "characters：" + (res.results[k].data.characters ? res.results[k].data.characters : ''), '\n',
        "来源：" + (res.results[k].data.source ? res.results[k].data.source : ''), '\n',
        "链接：" + res.results[k].data.ext_urls[0], '\n',
        segment.image(res.results[k].header.thumbnail), '\n',
        "一天内还可搜索" + long_remaining + "次"
        ]
      }

      else if (pother) {
        msg = msg = [
          segment.at(e.user_id), '\n',
          "相似度：" + res.results[k].header.similarity + "%\n",
          "标题：" + (res.results[k].data.title ? res.results[k].data.title : ''), '\n',
          "service：" + (res.results[k].data.service ? res.results[k].data.service : ''), '\n',
          "画师ID：" + (res.results[k].data.user_id ? res.results[k].data.user_id : ''), '\n',
          "来源：" + res.results[k].data.ext_urls[0], '\n',
          segment.image(res.results[k].header.thumbnail), '\n',
          "一天内还可搜索" + long_remaining + "次"
        ];
      }

      else if (jp) {
        msg = [
          segment.at(e.user_id), '\n',
          "相似度：" + res.results[k].header.similarity + "%\n",
          "画师：" + (res.results[k].data.creator ? res.results[k].data.creator : ''), '\n',
          "来源：" + (res.results[k].data.source ? res.results[k].data.source : ''), '\n',
          "日文名：" + (res.results[k].data.jp_name ? res.results[k].data.jp_name : ''), '\n',
          segment.image(res.results[k].header.thumbnail), '\n',
          "一天内还可搜索" + long_remaining + "次"
        ]
      }
      else {
        msg = [
          segment.at(e.user_id), '\n',
          "相似度：" + res.results[k].header.similarity + "%\n",
          "画师：" + res.results[k].data.creator || res.results[k].data.author || res.results[k].data.author_name, '\n',
          "来源：" + res.results[k].data.source || res.results[k].data.author_url, '\n',
          segment.image(res.results[k].header.thumbnail), '\n',
          "一天内还可搜索" + long_remaining + "次"
        ]
      }

      e.reply(msg);
    } catch (err) {
      console.log(err);
      let msg = [
        "请先尝试重启Yunzai再搜图，\n",
        "若仍报错则请将控制台报错信息和所搜图片发给插件修改者反馈bug"
      ]
      e.reply(msg);
    }
    this.cancel(e)
    return true;//返回true 阻挡消息不再往下
  }

  //取消搜图
  cancel(e) {
    if (this.soutuUser[e.user_id]) {
      clearTimeout(this.soutuUser[e.user_id]);
      delete this.soutuUser[e.user_id];
    }
  }
}

