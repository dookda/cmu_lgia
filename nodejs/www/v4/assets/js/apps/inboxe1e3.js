((s,e)=>{e(window),e("body"),s.Break;var a=e(".nk-ibx-aside"),i=e(".nk-ibx-link"),l=e(".nk-ibx-hide"),n=e(".nk-ibx-view"),o=e(".nk-ibx-reply-header"),t="hide-aside",d="show-ibx";s.Message=function(){var s;i.on("click",function(s){i.removeClass("current"),a.addClass(t),n.addClass(d),e(this).addClass("current"),s.preventDefault()}),l.on("click",function(s){a.removeClass(t),n.removeClass(d),s.preventDefault()}),o.on("click",function(s){e(this).hasClass("is-opened")||0<e(s.target).parents(".nk-reply-tools").length||(e(this).hasClass("is-collapsed")?e(this).removeClass("is-collapsed").next().addClass("is-shown"):e(this).hasClass("is-collapsed")||e(this).addClass("is-collapsed").next().removeClass("is-shown"))}),s=".tagify",0<(s=document.querySelectorAll(s)).length&&s.forEach(function(s){new Tagify(s)})},s.coms.docReady.push(s.Message)})(NioApp,jQuery);