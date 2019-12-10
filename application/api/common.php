<?php
function redis_handler(){
    return (new \think\cache\driver\Redis(config('cache')))->handler();
}