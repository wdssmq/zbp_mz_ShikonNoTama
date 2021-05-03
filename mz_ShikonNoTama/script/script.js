$(function () {
  let lsConfig = localStorage["mz-snt-confg"];
  if (!lsConfig) {
    lsConfig = { hide: [] };
  } else {
    lsConfig = JSON.parse(lsConfig);
  }
  $(".mz-snt-edt").click(function () {
    $(".item-hide-btn").toggleClass("hidden");
  });
  $("a.mz-snt-show").click(function () {
    $(".mz-snt-item.hidden").addClass("gray-1").removeClass("hidden");
  });
  $("a.js-view").click(function () {
    const url = $(this).data("href");
    fnAjax(url, fnFormat);
  });
  $(".js-view-content").on("click", ".item-hide-btn", function () {
    const key = $(this).data("key");
    $(`.key-${key}`).addClass("hidden");
    lsConfig.hide.push(key);
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
    let rltHTML = "";
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        const element = data[key];
        const regexp = new RegExp(`#?${strPubWord}`, "g");
        element.content = element.content.replace(regexp, "").trim();
        const curContent = `<div class="key-${key} mz-snt-item"><p>${element.time} <a class="item-hide-btn hidden" data-key="${key}" href="javascript:;">隐藏</a></p><p>${element.content}</p></div>`;
        rltHTML += curContent;
      }
    }
    $(".mz-snt-tool").removeClass("hidden");
    fnSrollToEL(".js-view-content");
    $(".js-view-content").html(rltHTML);
    lsConfig.hide.forEach(key => {
      $(`.key-${key}`).addClass("hidden");
    });
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
});
