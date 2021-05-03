<?php
#注册插件
RegisterPlugin("mz_ShikonNoTama", "ActivePlugin_mz_ShikonNoTama");

function ActivePlugin_mz_ShikonNoTama()
{
  Add_Filter_Plugin('Filter_Plugin_ViewFeed_End', 'mz_ShikonNoTama_Run');
}

function mz_ShikonNoTama_Run()
{
  $flag = GetVars('mz_ShikonNoTama', 'GET');
  if ("on" === $flag) {
    return false;
  }
  $rssList = mz_ShikonNoTama_ReadCFG("rssList");
  foreach ($rssList as $rssUrl) {
    $rltData = mz_ShikonNoTama_GetRSS("{$rssUrl}?mz_ShikonNoTama=on");
    mz_ShikonNoTama_SaveRLT2JSON($rltData);
  }
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
  $cfgFile = mz_ShikonNoTama_Path("cfg");
  $cfgDir = dirname($cfgFile);
  if (!is_dir($cfgDir)) {
    @mkdir($cfgDir, 0755);
    #code
  }
  if (!is_file($cfgFile)) {
    file_put_contents($cfgFile, json_encode(array('rssList' => array())));
  }
  $dir = mz_ShikonNoTama_Path("cache");
  if (!is_dir($dir)) {
    @mkdir($dir, 0755);
  }
  $dir = mz_ShikonNoTama_Path("usr");
  if (!is_dir($dir)) {
    @mkdir($dir, 0755);
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
  // $feed->enable_order_by_date(false);
  $success = $feed->init();
  // $feed->handle_content_type();
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
      if (strpos($itemContent, $PubWord) !== false && strpos($itemContent, "{$PubWord}Block") === false) {
        $rltData[$itemDate] = array("content" => $itemContent, "time" => date("Y-m-d H:i", $itemDate));
      }
    }
  }
  return $rltData;
}

function mz_ShikonNoTama_SaveRLT2JSON($rltData)
{
  foreach ($rltData as $time => $content) {
    $curTamp = mz_ShikonNoTama_GetCurMonday($time);
    $curTampStr = date("Y-m-d", $curTamp);
    $curFile = mz_ShikonNoTama_Path("usr/{$curTampStr}.json");
    $curData = array();
    if (is_file($curFile)) {
      $curData = json_decode(file_get_contents($curFile), true);
    }
    $curData[$time] = FormatString($content, "[nohtml]");
    file_put_contents($curFile, json_encode($curData));
  }
}

function mz_ShikonNoTama_GetCurMonday($time)
{
  $w = date("w", $time);
  return $time - ($time % 86400) - (86400 * ($w - 1)) - 3600 * 8 + 1;
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
