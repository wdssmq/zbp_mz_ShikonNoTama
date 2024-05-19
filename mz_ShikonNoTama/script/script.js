/* global strPubWord:false */
/* global fnViewEnd:false */
$(function() {
  (() => {
    const clipboard = new ClipboardJS(".mz-snt-copy");
    clipboard.on("success", function(e) {
      // count lines in text
      const lines = e.text.split("\n").length;
      e.trigger.innerHTML = `「已复制(${lines}行)」`;
      e.clearSelection();
    });
  })();

  let lsConfig = localStorage["mz-snt-confg"];
  if (!lsConfig) {
    lsConfig = { hide: [] };
  } else {
    lsConfig = JSON.parse(lsConfig);
  }

  const gob_config = {
    edtOn: false,
    edtMore: false,
    firstDay: null,
    lastDay: null,
    pickList: [],
  };

  // 启用编辑
  $(".mz-snt-edt").click(function() {
    if (gob_config.edtOn) {
      $(".mz-snt-item.hidden-flag").addClass("hidden");
      gob_config.edtOn = false;
    } else {
      $(".mz-snt-item.hidden-flag").removeClass("hidden");
      gob_config.edtOn = true;
    }
    // $(".mz-snt-item.hidden-flag").toggleClass("hidden");
    $(".item-hide-btn").toggleClass("hidden");
  });

  // 显示全部
  $("a.mz-snt-show").click(function() {
    $(".mz-snt-item.hidden-flag").toggleClass("hidden");
  });

  // JSON 条目解析
  function parseItem($el) {
    $el.addClass("bold");
    const url = $el.data("href");
    const title = $el.attr("title"),
      num = $el.data("num");
    // 判断是否有下一周的数据
    if (num < $(".mz-stn-title").length) {
      $(".mz-snt-next").removeClass("hidden");
    } else {
      $(".mz-snt-next").addClass("hidden");
    }
    return { url, title, num };
  }

  // 查看
  $(".mz-stn-title.js-view").click(function() {
    const $el = $(this);
    $(".mz-stn-title.js-view").removeClass("bold");
    $(".mz-stn-wrap-item").removeClass("pick");
    $el.parent().addClass("pick");
    // JSON 链接解析
    const oItem = parseItem($el);
    gob_config.firstDay = fnStrToDate(oItem.title);
    gob_config.lastDay = fnGetCurSunday(oItem.title);
    gob_config.nextDay = fnGetNextDay(gob_config.lastDay, true);
    gob_config.pickList = [oItem.num];
    gob_config.lstNum = oItem.num;
    gob_config.edtMore = false;
    fnAjax(oItem.url, $el, fnFormat);
  });

  // 载入下一周的数据
  $(".mz-snt-next").click(function() {
    $(this).addClass("hidden");
    const num = gob_config.lstNum + 1;
    const $el = $(`#item-${num}`);
    if ($el.length === 0) {
      return;
    }
    $el.parent().addClass("pick");
    // JSON 链接解析
    const oItem = parseItem($el);
    // gob_config.firstDay = fnStrToDate(oItem.title);
    gob_config.lastDay = fnGetCurSunday(oItem.title);
    gob_config.nextDay = fnGetNextDay(gob_config.lastDay, true);
    gob_config.pickList.push(oItem.num);
    gob_config.lstNum = oItem.num;
    gob_config.edtMore = true;
    fnAjax(oItem.url, $el, fnFormat);
  });

  // 隐藏切换
  $(".mz-snt-view").on("click", ".item-hide-btn", function() {
    const key = $(this).data("key");
    const setHide = new Set(lsConfig.hide);
    if (setHide.has(key)) {
      setHide.delete(key);
    } else {
      setHide.add(key);
    }
    $(`.key-${key}`).toggleClass("hidden-flag");
    lsConfig.hide = [...setHide];
    localStorage["mz-snt-confg"] = JSON.stringify(lsConfig);
  });

  function fnSrollToEL(target) {
    // console.log(target);
    $("body,html").animate(
      {
        scrollTop: $(target).offset().top - 59,
      },
      500,
    );
  }

  function fnFormat(data, $el) {
    let rltHTML = "<div class=\"view-head mz-snt-box\"></div>";
    if (gob_config.edtMore) {
      rltHTML = gob_config.viewHTML;
    }

    const keys = Object.keys(data);
    const cntNum = keys.length;
    // 显示条目数
    if (!$el.data("cnt")) {
      $el.after(`<span class="mz-snt-cnt">(${cntNum})</span>`);
      $el.data("cnt", cntNum);
    }
    // 获取 .mz-snt-cnt 的内容并累加
    const $cntList = $(".pick .mz-snt-cnt");
    let cntSum = 0;
    $cntList.each(function() {
      cntSum += parseInt($(this).text().replace(/\(|\)/g, ""));
    });
    $(".mz-snt-cnt-sum").text(`(${cntSum})`);

    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        const element = data[key];
        const regexp = new RegExp(`#?${strPubWord}`, "g");
        element.content = element.content.replace(regexp, "").trim();
        element.content = element.content.replace(/\s?\\\|(\n|\\n)/g,"\\\|").replace(/\\n|\\\|/g, "</p><p>");
        const curContent = `<div class="key-${key} mz-snt-item"><h3>${element.time} <a class="item-hide-btn hidden" data-key="${key}" href="javascript:;">隐藏</a></h3><p>${element.content}</p></div>`;
        rltHTML += curContent;
      }
    }

    $(".mz-snt-tool").removeClass("hidden");

    if (!gob_config.edtMore) {
      fnSrollToEL(".mz-snt-view");
    } else {
      fnSrollToEL(".mz-snt-footer");
    }

    gob_config.viewHTML = rltHTML;
    $(".mz-snt-view").html(rltHTML);

    lsConfig.hide.forEach((key) => {
      $(`.key-${key}`).addClass("hidden hidden-flag");
    });

    if (gob_config.firstDay) {
      const { firstDay, lastDay, nextDay } = gob_config;
      // console.log(gob_config);
      // console.log(firstDay, lastDay);
      const tpl = new Template($(".tpl-view-head").html());
      const s = tpl.render({
        firstDay: firstDay.Format("yyyy/MM/dd"),
        lastDay: lastDay.Format("yyyy/MM/dd"),
        nextDay: nextDay.Format("yyyy-MM-dd HH:mm:ss"),
      });
      $(".mz-snt-copy").removeClass("hidden").text("「复制」");
      $(".view-head").html(s);
    }

    try {
      fnViewEnd();
    } catch (error) {
      console.log(error);
    }
  }

  function fnAjax(url, $el, cb) {
    $.ajax({
      url: url,
      dataType: "json",
      success: function(data) {
        // console.log(data);
        cb(data, $el);
      },
    });
  }

  // Template Class
  class Template {
    constructor(str) {
      this.str = str.replace(/\s\\\n/g, "<br>").replace(/\s\\$/, "<br>");
    }
    render(data) {
      return this.str.replace(/\{\s(.*?)\s\}/g, (match, key) => {
        return data[key];
      });
    }
  }

  // 日期格式化
  Date.prototype.Format = function(fmt) {
    const o = {
      "y+": this.getFullYear(), // 年份
      "M+": this.getMonth() + 1, // 月份
      "d+": this.getDate(), // 日
      "H+": this.getHours(), // 小时
      "m+": this.getMinutes(), // 分
      "s+": this.getSeconds(), // 秒
      "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
      S: this.getMilliseconds(), // 毫秒
    };
    for (let k in o) {
      if (new RegExp(`(${k})`).test(fmt)) {
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length == 1
            ? o[k]
            : ("0" + o[k]).slice(-RegExp.$1.length),
        );
      }
    }
    return fmt;
  };

  // "2021-12-06" 转 Date 对象
  function fnStrToDate(str) {
    const arr = str.split("-");
    const date = new Date(arr[0], arr[1] - 1, arr[2]);
    return date;
  }

  // 获取日期的第二天
  function fnGetNextDay(date, setCurTime = false) {
    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    // 设置时间为当前
    if (setCurTime) {
      const curDate = new Date();
      nextDay.setHours(curDate.getHours());
      nextDay.setMinutes(curDate.getMinutes());
      nextDay.setSeconds(curDate.getSeconds());
    }
    return nextDay;
  }

  // 获取日期所在周的星期日
  function fnGetCurSunday(dt = new Date()) {
    if (typeof dt === "string") {
      dt = fnStrToDate(dt);
    }
    dt.setDate(dt.getDate() - dt.getDay() + 7);
    return dt;
  }
});
