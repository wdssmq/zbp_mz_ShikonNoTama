<?php
#注册插件
RegisterPlugin("mz_ShikonNoTama", "ActivePlugin_mz_ShikonNoTama");

function ActivePlugin_mz_ShikonNoTama()
{
  Add_Filter_Plugin('Filter_Plugin_Feed_End', 'mz_ShikonNoTama_Run');
  Add_Filter_Plugin('Filter_Plugin_Admin_TopMenu', 'mz_ShikonNoTama_AddTopMenu');
}

function mz_ShikonNoTama_AddTopMenu(&$m)
{
  global $zbp;
  $m[] = MakeTopMenu("root", '碎雨集', $zbp->host . "zb_users/plugin/mz_ShikonNoTama/main.php", "", "topmenu_mz_ShikonNoTama", "icon-window-fill");
}

function mz_ShikonNoTama_Run()
{
  $flag = GetVars('mz_ShikonNoTama', 'GET');
  if ("on" === $flag) {
    return false;
  }
  $rssList = mz_ShikonNoTama_ReadCFG("rssList");
  $pickUrl = $rssList[array_rand($rssList, 1)];
  $rltData = mz_ShikonNoTama_GetRSS("{$pickUrl}?mz_ShikonNoTama=on");
  mz_ShikonNoTama_SaveRLT2JSON($rltData);
}

function mz_ShikonNoTama_Path($file, $t = 'path')
{
  global $zbp;
  $result = $zbp->$t . 'zb_users/plugin/mz_ShikonNoTama/';
  switch ($file) {
    case 'cfg':
      return $result . 'config/config.json';
      break;
    case 'main':
      return $result . 'main.php';
      break;
    default:
      return $result . $file;
  }
}

function InstallPlugin_mz_ShikonNoTama()
{
  global $zbp;
  if (!$zbp->Config('mz_ShikonNoTama')->HasKey("tplHead")){
    $zbp->Config('mz_ShikonNoTama')->tplHead = '<h2>{ firstDay } ~ { lastDay }</h2>';
    $zbp->SaveConfig('mz_ShikonNoTama');
  }
  // 初始化配置文件
  $cfgFile = mz_ShikonNoTama_Path("cfg");
  $cfgDir = dirname($cfgFile);
  if (!is_dir($cfgDir)) {
    @mkdir($cfgDir, 0755);
    #code
  }
  if (!is_file($cfgFile)) {
    file_put_contents($cfgFile, json_encode(array('rssList' => array())));
  }
  // 缓存目录
  $dir = mz_ShikonNoTama_Path("cache");
  if (!is_dir($dir)) {
    @mkdir($dir, 0755);
  }
  // 存放抓取结果
  $dir = mz_ShikonNoTama_Path("usr");
  if (!is_dir($dir)) {
    @mkdir($dir, 0755);
  }
  // 调试文件删除
  $file = mz_ShikonNoTama_Path("cache/debug.txt");
  if (!$zbp->option['ZC_DEBUG_MODE'] && is_file($file)) {
    unlink($file);
  }
}

function UninstallPlugin_mz_ShikonNoTama()
{
}
// -----------------
function mz_ShikonNoTama_ReadCFG($key, $format = "object")
{
  $cfgFile = mz_ShikonNoTama_Path("cfg");
  $cfgData = json_decode(file_get_contents($cfgFile));
  $rltString = join("\n", $cfgData->$key);
  return $format === "string" ? $rltString : $cfgData->$key;
}

function mz_ShikonNoTama_SaveCFG($key, $val)
{
  if ($key !== "rssList") {
    return false;
  }
  $val = trim($val);
  $cfgFile = mz_ShikonNoTama_Path("cfg");
  $cfgData = json_decode(file_get_contents($cfgFile));
  $cfgData->$key = explode("\n", $val);
  file_put_contents($cfgFile, json_encode($cfgData));
  return true;
}

function mz_ShikonNoTama_GetRSS($url)
{
  require __DIR__ . "/vendor/autoload.php";
  global $zbp;
  $cache = mz_ShikonNoTama_Path("cache");
  $feed = new SimplePie($url, $cache);
  // $feed->enable_cache(false);
  // $feed->enable_order_by_date(false);
  // $feed->handle_content_type();
  $success = $feed->init();
  // mz_ShikonNoTama_Debug($url);
  // mz_ShikonNoTama_Debug((int)$success);
  $rltData = array();
  if ($success) {
    $feedItems = $feed->get_items();
    $PubWord = $zbp->Config('mz_ShikonNoTama')->PubWord;
    $PubWord = str_replace("#", "", $PubWord);
    if (empty($PubWord)) {
      $PubWord = "PubWord";
    }
    foreach ($feedItems as $item) {
      $itemContent = $item->get_content();
      $itemDate = $item->get_date('U');
      // mz_ShikonNoTama_Debug($itemContent);
      if (strpos($itemContent, $PubWord) !== false && strpos($itemContent, "{$PubWord}Block") === false) {
        $rltData[$itemDate] = array("content" => $itemContent, "time" => date("Y-m-d H:i", $itemDate));
        // mz_ShikonNoTama_Debug($itemContent, $rltData[$itemDate]["time"]);
      }
    }
  }
  // mz_ShikonNoTama_Debug("\n");
  return $rltData;
}

function mz_ShikonNoTama_SaveRLT2JSON($rltData)
{
  foreach ($rltData as $time => $item) {
    $curTamp = mz_ShikonNoTama_GetCurMonday($time);
    $curTampStr = date("Y-m-d", $curTamp);
    $curFile = mz_ShikonNoTama_Path("usr/{$curTampStr}.json");
    $curData = array();
    if (is_file($curFile)) {
      $curData = json_decode(file_get_contents($curFile), true);
    }
    $curData[$time] = FormatString($item, "[nohtml]");
    file_put_contents($curFile, json_encode($curData));
  }
}

function mz_ShikonNoTama_GetCurMonday($time)
{
  $w = date("N", $time);
  return $time - ($time % 86400) - (86400 * ($w - 1)) - 3600 * 8;
}

function mz_ShikonNoTama_View()
{
  global $zbp;
  $tpl = '<p><a class="js-view" data-href="-href-" title="-name-" href="javascript:;">-name-.json</a></p>';
  $jsonDir = mz_ShikonNoTama_Path("usr");
  $jsonFiles = GetFilesInDir($jsonDir, "json");
  foreach ($jsonFiles as $jsonName => $jsonPath) {
    $jsonHref = str_replace($zbp->path, $zbp->host, $jsonPath);
    echo strtr($tpl, array("-name-" => $jsonName, "-href-" => $jsonHref));
  }
}

function mz_ShikonNoTama_a($href, $title, $text = "")
{
  if (empty($text)) {
    $text = $href;
  }
  return "<a target=\"_blank\" href=\"{$href}\" title=\"{$title}\">$text</a>";
}

function mz_ShikonNoTama_Debug($str)
{
  $args = func_get_args();
  if (count($args) > 1) {
    $str = join("，", $args);
  }
  $file = mz_ShikonNoTama_Path("cache/debug.txt");
  $str .= "\n";
  $str = FormatString($str, "[nohtml]");
  file_put_contents($file, $str, FILE_APPEND);
}
