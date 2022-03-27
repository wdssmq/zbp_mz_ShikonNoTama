$(function () {
  (() => {
    const clipboard = new ClipboardJS('.mz-snt-copy');
    clipboard.on('success', function (e) {
      // count lines in text
      const lines = e.text.split('\n').length;
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
  $(".mz-snt-edt").click(function () {
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
  $("a.mz-snt-show").click(function () {
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
  $(".mz-stn-title.js-view").click(function () {
    $(".mz-stn-title.js-view").removeClass("bold");
    // JSON 链接解析
    oItem = parseItem($(this));
    gob_config.firstDay = fnStrToDate(oItem.title);
    gob_config.lastDay = fnGetCurSunday(oItem.title);
    gob_config.pickList = [oItem.num];
    gob_config.lstNum = oItem.num;
    gob_config.edtMore = false;
    fnAjax(oItem.url, fnFormat);
  });
  // 载入下一周的数据
  $(".mz-snt-next").click(function () {
    num = gob_config.lstNum + 1;
    $el = $(`#item-${num}`);
    if ($el.length === 0) {
      return;
    }
    // JSON 链接解析
    oItem = parseItem($el);
    // gob_config.firstDay = fnStrToDate(oItem.title);
    gob_config.lastDay = fnGetCurSunday(oItem.title);
    gob_config.pickList.push(oItem.num);
    gob_config.lstNum = oItem.num;
    gob_config.edtMore = true;
    fnAjax(oItem.url, fnFormat);
  });
  // 隐藏切换
  $(".mz-snt-view").on("click", ".item-hide-btn", function () {
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
      500
    );
  }
  function fnFormat(data) {
    let rltHTML = '<div class="view-head mz-snt-box"></div>';
    if (gob_config.edtMore) {
      rltHTML = gob_config.viewHTML;
    }
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        const element = data[key];
        const regexp = new RegExp(`#?${strPubWord}`, "g");
        element.content = element.content.replace(regexp, "").trim();
        element.content = element.content.replace(/\\n|\\\|/g, "</p><p>");
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
      const { firstDay, lastDay } = gob_config;
      // console.log(gob_config);
      // console.log(firstDay, lastDay);
      const tpl = new Template($(".tpl-view-head").html());
      const s = tpl.render({
        firstDay: firstDay.Format("yyyy/MM/dd"),
        lastDay: lastDay.Format("yyyy/MM/dd"),
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
  function fnAjax(url, cb) {
    $.ajax({
      url: url,
      dataType: "json",
      success: function (data) {
        // console.log(data);
        cb(data);
      },
    });
  }

  class Template {
    constructor(tpl) {
      let fn,
        match,
        code = [
          "let r=[];",
          "let _html = function (str) { return str.replace(/&/g, '&amp;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };",
        ],
        re = /\{\s*([a-zA-Z\.\_0-9()]+)(\s*\|\s*safe)?\s*\}/m,
        addLine = function (text) {
          code.push(
            "r.push('" +
            text
              .replace(/\'/g, "\\'")
              .replace(/\n/g, "\\n")
              .replace(/\r/g, "\\r") +
            "');"
          );
        };
      tpl = tpl.replace(/\s\\\n/g, "<br>");
      while ((match = re.exec(tpl))) {
        if (match.index > 0) {
          addLine(tpl.slice(0, match.index));
        }
        if (match[2]) {
          code.push("r.push(String(this." + match[1] + "));");
        } else {
          code.push("r.push(_html(String(this." + match[1] + ")));");
        }
        tpl = tpl.substring(match.index + match[0].length);
      }
      addLine(tpl);
      // code.push('console.log(r.join(""));');
      code.push('return r.join("").trim();');
      fn = new Function(code.join("\n"));
      this.render = function (model) {
        return fn.apply(model);
        s;
      };
    }
  }

  Date.prototype.Format = function (fmt) {
    var o = {
      "M+": this.getMonth() + 1, //月份
      "d+": this.getDate(), //日
      "H+": this.getHours(), //小时
      "m+": this.getMinutes(), //分
      "s+": this.getSeconds(), //秒
      "q+": Math.floor((this.getMonth() + 3) / 3), //季度
      S: this.getMilliseconds(), //毫秒
    };
    if (/(y+)/.test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        (this.getFullYear() + "").substr(4 - RegExp.$1.length)
      );
    for (var k in o)
      if (new RegExp("(" + k + ")").test(fmt))
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length == 1
            ? o[k]
            : ("00" + o[k]).substr(("" + o[k]).length)
        );
    return fmt;
  };

  // "2021-12-06" 转 Date 对象
  function fnStrToDate(str) {
    const arr = str.split("-");
    const date = new Date(arr[0], arr[1] - 1, arr[2]);
    return date;
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
