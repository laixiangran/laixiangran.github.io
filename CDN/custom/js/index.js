/**
 * Created by laixiangran@163.com on 2016/5/1
 * homepage：http://www.laixiangran.cn
 */

COM.$W.domReady(function() {
    new pageSwitch({
        "container" : "container", // 容器，默认为id：container
        "pages" : "section" // 子容器，默认为类名：page
    });
});