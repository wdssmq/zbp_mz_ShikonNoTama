<?php
require '../../../zb_system/function/c_system_base.php';
require '../../../zb_system/function/c_system_admin.php';
$zbp->Load();
$action = 'root';
if (!$zbp->CheckRights($action)) {
  $zbp->ShowError(6);
  die();
}
if (!$zbp->CheckPlugin('mz_ShikonNoTama')) {
  $zbp->ShowError(48);
  die();
}

$act = GetVars('act', 'GET');
$suc = GetVars('suc', 'GET');
if ($act == 'save') {
  CheckIsRefererValid();
  foreach ($_POST as $key => $val) {
    if (substr($key, 0, 5) == 'read_') {
      continue;
    }
    if (mz_ShikonNoTama_SaveCFG($key, $val)) {
      continue;
    }
    $zbp->Config('mz_ShikonNoTama')->$key = trim($val);
  }
  $zbp->SaveConfig('mz_ShikonNoTama');
  $zbp->BuildTemplate();
  $zbp->SetHint('good');
  Redirect('./main.php' . ($suc == null ? '' : "?act={$suc}"));
}

InstallPlugin_mz_ShikonNoTama();
$enCodeFeed = urlencode("{$zbp->host}feed.php");

$rssList = mz_ShikonNoTama_ReadCFG("rssList", "string");

$blogtitle = '碎雨集';
require $blogpath . 'zb_system/admin/admin_header.php';
require $blogpath . 'zb_system/admin/admin_top.php';
?>
<link rel="stylesheet" href="css/style.css">
<div id="divMain">
  <div class="divHeader">
    <?php echo $blogtitle; ?>
  </div>
  <div class="SubMenu">
    <a href="main.php" title="首页"><span class="m-left m-now">首页</span></a>
    <?php require "about.php"; ?>
  </div>
  <div id="divMain2">
    <form action="<?php echo BuildSafeURL("main.php?act=save"); ?>" method="post">
      <table width="100%" class="tableBorder">
        <tr>
          <th width="10%">项目</th>
          <th>内容</th>
          <th width="45%">说明</th>
        </tr>
        <tr>
          <td>RSS 列表</td>
          <td><?php zbpform::textarea("rssList", $rssList, "90%"); ?></td>
          <td>用于定时抓取的数据源</td>
        </tr>
        <tr>
          <td>关键词</td>
          <td><?php zbpform::text("PubWord", $zbp->Config("mz_ShikonNoTama")->PubWord, "90%"); ?></td>
          <td>提取 RSS 输出中含有该关键词的项</td>
        </tr>
        <tr>
          <td>头部模板</td>
          <td><?php zbpform::textarea("tplHead", htmlspecialchars($zbp->Config("mz_ShikonNoTama")->tplHead), "90%"); ?></td>
          <td>可用标签：{ firstDay } { lastDay }</td>
        </tr>
        <tr>
          <td>回调函数</td>
          <td><?php zbpform::textarea("jsCalBak", htmlspecialchars($zbp->Config("mz_ShikonNoTama")->jsCalBak), "90%"); ?></td>
          <td>检出内容的后续处理</td>
        </tr>
        <tr>
          <td></td>
          <td colspan="2"><input type="submit" value="提交" /></td>
        </tr>
      </table>
    </form>
    <p class="mz-snt-box">访问触发：<?php echo mz_ShikonNoTama_a($zbp->feedurl, "RSS 地址"); ?></p>
    <p class="mz-snt-box">订阅：<?php echo mz_ShikonNoTama_a("https://feeds.pub/feed/{$enCodeFeed}", "订阅"); ?></p>
    <p class="mz-snt-box">订阅：<?php echo mz_ShikonNoTama_a("https://www.innoreader.com/feed/{$enCodeFeed}", "订阅"); ?></p>
    <!-- 数据列表 -->
    <div class="mz-snt-box"><?php mz_ShikonNoTama_View(); ?></div>
    <!-- 工具条 -->
    <div class="mz-snt-tool hidden mz-snt-box">工具条：<a class="mz-snt-edt" title="切换隐藏按钮显示" href="javascript:;">启用编辑</a> / <a class="mz-snt-show" title="显示隐藏的项目" href="javascript:;">显示全部</a> / 隐藏状态将记录在 localStorage 中</div>
    <div class="mz-snt-view mz-snt-box"></div>
    <div class="mz-snt-box"><a href="javascript:;" class="mz-snt-next hidden">载入下一周数据</a></div>
  </div>
</div>
<script>
  const strPubWord = '<?php echo $zbp->Config("mz_ShikonNoTama")->PubWord; ?>';
</script>
<script class="tpl-view-head" type="text/plain"><?php echo $zbp->Config("mz_ShikonNoTama")->tplHead; ?></script>
<script>
  const fnViewEnd = function() {
    <?php echo $zbp->Config("mz_ShikonNoTama")->jsCalBak; ?>
  };
</script>
<script src="script/script.js"></script>
<?php
require $blogpath . 'zb_system/admin/admin_footer.php';
RunTime();
?>
