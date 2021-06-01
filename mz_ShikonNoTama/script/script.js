$(function () {
  let lsConfig = localStorage["mz-snt-confg"];
  if (!lsConfig) {
    lsConfig = { hide: [] };
  } else {
    lsConfig = JSON.parse(lsConfig);
  }
  const gob_config = { edtOn: false };
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
  // 查看
  $(".mz-stn-title.js-view").click(function () {
    const url = $(this).data("href");
    gob_config.firstDay = Date.parse($(this).attr("title"));
    gob_config.lastDay = gob_config.firstDay + (86400000 * 6);
    fnAjax(url, fnFormat);
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
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        const element = data[key];
        const regexp = new RegExp(`#?${strPubWord}`, "g");
        element.content = element.content.replace(regexp, "").trim();
        const curContent = `<div class="key-${key} mz-snt-item"><h3>${element.time} <a class="item-hide-btn hidden" data-key="${key}" href="javascript:;">隐藏</a></h3><p>${element.content}</p></div>`;
        rltHTML += curContent;
      }
    }
    $(".mz-snt-tool").removeClass("hidden");
    fnSrollToEL(".mz-snt-view");
    $(".mz-snt-view").html(rltHTML);
    lsConfig.hide.forEach(key => {
      $(`.key-${key}`).addClass("hidden hidden-flag");
    });
    if (gob_config.firstDay) {
      const firstDay = new Date(gob_config.firstDay);
      const lastDay = new Date(gob_config.lastDay);
      // console.log(gob_config);
      // console.log(firstDay, lastDay);
      const tpl = new Template($('.tpl-view-head').html());
      const s = tpl.render({
        firstDay: firstDay.Format("yyyy/MM/dd"),
        lastDay: lastDay.Format("yyyy/MM/dd")
      });
      $(".view-head").html(s);
    }
  }
  function fnAjax(url, cb) {
    $.ajax({
      url: url,
      dataType: "json",
      success: function (data) {
        // console.log(data);
        cb(data);
      }
    });
  }

  function Template(tpl) {
    let
      fn,
      match,
      code = ['let r=[];', 'let _html = function (str) { return str.replace(/&/g, \'&amp;\').replace(/"/g, \'&quot;\').replace(/\'/g, \'&#39;\').replace(/</g, \'&lt;\').replace(/>/g, \'&gt;\'); };'],
      re = /\{\s*([a-zA-Z\.\_0-9()]+)(\s*\|\s*safe)?\s*\}/m,
      addLine = function (text) {
        code.push('r.push(\'' + text.replace(/\'/g, '\\\'').replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '\');');
      };
    tpl = tpl.replace(/\s\\\n/g, '<br>');
    while (match = re.exec(tpl)) {
      if (match.index > 0) {
        addLine(tpl.slice(0, match.index));
      }
      if (match[2]) {
        code.push('r.push(String(this.' + match[1] + '));');
      }
      else {
        code.push('r.push(_html(String(this.' + match[1] + ')));');
      }
      tpl = tpl.substring(match.index + match[0].length);
    }
    addLine(tpl);
    // code.push('console.log(r.join(""));');
    code.push('return r.join("").trim();');
    fn = new Function(code.join('\n'));
    this.render = function (model) {
      return fn.apply(model); s
    };
  }


  Date.prototype.Format = function (fmt) {
    var o = {
      "M+": this.getMonth() + 1, //月份
      "d+": this.getDate(), //日
      "H+": this.getHours(), //小时
      "m+": this.getMinutes(), //分
      "s+": this.getSeconds(), //秒
      "q+": Math.floor((this.getMonth() + 3) / 3), //季度
      "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
      if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
  }
});
