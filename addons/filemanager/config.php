<?php

return array (
  0 => 
  array (
    'name' => 'theme',
    'title' => '管理器皮肤',
    'type' => 'select',
    'content' => 
    array (
      'default' => '默认',
      'fastadmin' => 'FastAdmin',
    ),
    'value' => 'fastadmin',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  1 => 
  array (
    'name' => 'readOnly',
    'title' => '只读模式',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '0',
    'rule' => 'required',
    'msg' => '',
    'tip' => '开启后将只可浏览，不可编辑',
    'ok' => '',
    'extend' => '',
  ),
  2 => 
  array (
    'name' => 'directory',
    'title' => '文件管理目录',
    'type' => 'string',
    'content' => 
    array (
    ),
    'value' => '../',
    'rule' => '',
    'msg' => '',
    'tip' => '可填写服务器的绝对目录或项目的相对目录,留空表示项目根目录',
    'ok' => '',
    'extend' => '',
  ),
  3 => 
  array (
    'name' => 'previewUrl',
    'title' => '预览URL',
    'type' => 'string',
    'content' => 
    array (
    ),
    'value' => '',
    'rule' => '',
    'msg' => '',
    'tip' => '文件管理目录的URL预览地址',
    'ok' => '',
    'extend' => '',
  ),
  4 => 
  array (
    'name' => 'extensions',
    'title' => '允许查看的文件后缀',
    'type' => 'text',
    'content' => 
    array (
    ),
    'value' => 'php,
css,
js,
less,
html,
jpg,jpeg,gif,png,svg,
ogv,avi,mkv,mp4,webm,m4v,ogg,mp3,wav,
txt,pdf,odp,ods,odt,rtf,doc,docx,xls,xlsx,ppt,pptx,csv,md,
zip,tar,rar,
ogg,mp3,wav,
ogv,avi,mkv,mp4,webm,m4v,env',
    'rule' => 'required',
    'msg' => '',
    'tip' => '允许查看的文件后缀,以半角逗号进行分隔',
    'ok' => '',
    'extend' => '',
  ),
  5 => 
  array (
    'name' => 'searchBox',
    'title' => '搜索栏',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '1',
    'rule' => 'required',
    'msg' => '开启后将在左下角显示搜索栏',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  6 => 
  array (
    'name' => 'folderPosition',
    'title' => '文件夹位置',
    'type' => 'radio',
    'content' => 
    array (
      'top' => '前',
      'bottom' => '后',
    ),
    'value' => 'top',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  7 => 
  array (
    'name' => 'fileSorting',
    'title' => '文件夹位置',
    'type' => 'select',
    'content' => 
    array (
      'NAME_ASC' => '按名称从A-Z',
      'NAME_DESC' => '按名称从Z-A',
      'TYPE_ASC' => '按后缀从A-Z',
      'TYPE_DESC' => '按后缀从Z-A',
      'SIZE_ASC' => '按大小从小到大',
      'SIZE_DESC' => '按大小从大到小',
      'MODIFIED_ASC' => '按修改日期从旧到新',
      'MODIFIED_DESC' => '按修改日期从新到旧',
    ),
    'value' => 'NAME_ASC',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  8 => 
  array (
    'name' => 'logger',
    'title' => '浏览器日志',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '0',
    'rule' => 'required',
    'msg' => '开启后将在浏览器控制台打印日志',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  9 => 
  array (
    'name' => 'allowFolderDownload',
    'title' => '开启文件夹下载',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '0',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  10 => 
  array (
    'name' => 'allowChangeExtensions',
    'title' => '是否可修改文件后缀',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '0',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  11 => 
  array (
    'name' => 'capabilities',
    'title' => '工具栏按钮',
    'type' => 'string',
    'content' => 
    array (
    ),
    'value' => 'select,upload,download,rename,copy,move,delete,extract',
    'rule' => 'required',
    'msg' => '',
    'tip' => '工具栏按钮',
    'ok' => '',
    'extend' => '',
  ),
  12 => 
  array (
    'name' => 'languageDefault',
    'title' => '默认语言',
    'type' => 'select',
    'content' => 
    array (
      'en' => 'Englisth',
      'zh-cn' => '简体中文',
      'zh-tw' => '繁體中文',
    ),
    'value' => 'zh-cn',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  13 => 
  array (
    'name' => 'filetreeEnabled',
    'title' => '开启左侧边栏',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '1',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  14 => 
  array (
    'name' => 'foldersOnly',
    'title' => '边栏仅显示文件夹',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '0',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  15 => 
  array (
    'name' => 'reloadOnClick',
    'title' => '点击边栏后刷新列表',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '0',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  16 => 
  array (
    'name' => 'showLine',
    'title' => '显示边栏分隔线',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '1',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  17 => 
  array (
    'name' => 'filetreeWidth',
    'title' => '边栏宽度',
    'type' => 'number',
    'content' => 
    array (
    ),
    'value' => '200',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  18 => 
  array (
    'name' => 'filetreeMinWidth',
    'title' => '边栏最小宽度',
    'type' => 'number',
    'content' => 
    array (
    ),
    'value' => '200',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  19 => 
  array (
    'name' => 'defaultViewMode',
    'title' => '默认浏览模式',
    'type' => 'radio',
    'content' => 
    array (
      'grid' => '网格',
      'list' => '列表',
    ),
    'value' => 'grid',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  20 => 
  array (
    'name' => 'dblClickOpen',
    'title' => '双击打开',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '0',
    'rule' => 'required',
    'msg' => '双击打开文件或文件夹',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  21 => 
  array (
    'name' => 'selectionEnabled',
    'title' => '挺拽选择',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '1',
    'rule' => 'required',
    'msg' => '',
    'tip' => '是否开启点击和拖拽选择',
    'ok' => '',
    'extend' => '',
  ),
  22 => 
  array (
    'name' => 'selectionUseCtrKey',
    'title' => '配合Ctrl选择',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '0',
    'rule' => 'required',
    'msg' => '',
    'tip' => '必须按住Ctrl才可以多选',
    'ok' => '',
    'extend' => '',
  ),
  23 => 
  array (
    'name' => 'uploadMultiple',
    'title' => '开启多文件上传功能',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '1',
    'rule' => 'required',
    'msg' => '',
    'tip' => '开启后将可以上传多文件',
    'ok' => '',
    'extend' => '',
  ),
  24 => 
  array (
    'name' => 'maxNumberOfFiles',
    'title' => '单次最大上传文件数',
    'type' => 'number',
    'content' => 
    array (
    ),
    'value' => '5',
    'rule' => 'required',
    'msg' => '',
    'tip' => '',
    'ok' => '',
    'extend' => '',
  ),
  25 => 
  array (
    'name' => 'clipboardEnabled',
    'title' => '开启复制粘贴',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '1',
    'rule' => 'required',
    'msg' => '',
    'tip' => '开启后将可以直接复制、剪切、粘贴文件或文件夹',
    'ok' => '',
    'extend' => '',
  ),
  26 => 
  array (
    'name' => 'editorEnabled',
    'title' => '开启编辑器',
    'type' => 'bool',
    'content' => 
    array (
    ),
    'value' => '1',
    'rule' => 'required',
    'msg' => '',
    'tip' => '开启后将可以直接在线修改文件',
    'ok' => '',
    'extend' => '',
  ),
  27 => 
  array (
    'name' => 'editorExtensions',
    'title' => '可编辑的文件后缀',
    'type' => 'text',
    'content' => 
    array (
    ),
    'value' => 'php,css,js,less,html,csv,env',
    'rule' => 'required',
    'msg' => '',
    'tip' => '多个后缀请以半角逗号分隔',
    'ok' => '',
    'extend' => '',
  ),
);
