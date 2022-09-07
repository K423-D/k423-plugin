import fetch from "node-fetch";
import { segment } from "oicq";

export class shareMusic extends plugin {
  constructor() {
    super({
      name: '点歌',
      dsc: '点歌',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      priority: 1000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: "^[非VIP]*点歌(.*)$",
          /** 执行方法 */
          fnc: 'shareMusic'
        }
      ]
    })
  }

  async shareMusic(e) {
    const urlList = {
      qq: "https://c.y.qq.com/soso/fcgi-bin/client_search_cp?g_tk=5381&p=1&n=20&w=paramsSearch&format=json&loginUin=0&hostUin=0&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0&remoteplace=txt.yqq.song&t=0&aggr=1&cr=1&catZhida=1&flag_qc=0",
      kugou:
        "http://mobilecdn.kugou.com/api/v3/search/song?format=json&keyword=paramsSearch&page=1&pagesize=20&showtype=1",
      wangyiyun: "https://autumnfish.cn/search?keywords=paramsSearch",
    };

    //e.msg 用户的命令消息
    let msg = e.msg.replace(/\s*/g, "");
    let isQQReg = new RegExp("^[非VIP]*点歌*(qq|QQ)(.*)$");
    let isKugouReg = new RegExp("^[非VIP]*点歌*(kugou|酷狗)(.*)$");
    let isWangYiyunReg = new RegExp("^[非VIP]*点歌*(网易云|网抑云)(.*)$");
    let isQQ = isQQReg.test(msg);
    let isKugou = isKugouReg.test(msg);
    let isWangYiyun = isWangYiyunReg.test(msg);
    if (!isQQ && !isKugou && !isWangYiyun) isWangYiyun = true;
    let isPay = msg.includes("非VIP");
    console.log("什么！这个穷鬼点非VIP？？？");
    msg = msg.replace(/[非VIP|点歌|qq|QQ|kugou|酷狗|网易云|网抑云]/g, "");
    console.log("这个崽种在搜", msg);
    try {
      // msg = encodeURI(msg);
      // const params = { search: msg };
      let apiName = isQQ ? "qq" : isKugou ? "kugou" : "wangyiyun";
      let url = urlList[apiName].replace("paramsSearch", msg);
      let response = await fetch(url);
      const { data, result } = await response.json();
      console.log(result);
      let songList = [];
      if (isQQ)
        songList = isPay ? data.song.list.filter((item) => !item.pay.payinfo) : data.song.list;
      else if (isKugou) songList = isPay ? data.info.filter((item) => !item.pay_type_sq) : data.info;
      else songList = result?.songs?.length ? result.songs : [];
      if (!songList[0]) {
        await e.reply(`没有找到该歌曲哦`);
      } else if (e.isPrivate) {
        await e.friend.shareMusic(
          isQQ ? "qq" : isKugou ? "kugou" : "163",
          isQQ ? songList[0].songid : isKugou ? songList[0].hash : songList[0].id
        );
      } else if (e.isGroup) {
        await e.group.shareMusic(
          isQQ ? "qq" : isKugou ? "kugou" : "163",
          isQQ ? songList[0].songid : isKugou ? songList[0].hash : songList[0].id
        );
        // if (isWangYiyun) {
        //   let response = await fetch(`https://autumnfish.cn/song/url?id=${songList[0].id}`);
        //   const { data } = await response.json();
        //   if (!data[0].url) return true;
        //   await e.reply(segment.record(data[0].url));
        // }
      }
    } catch (error) {
      console.log(error);
    }
    return true; //返回true 阻挡消息不再往下
  }


}