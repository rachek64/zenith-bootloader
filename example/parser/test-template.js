system.component.template
.define('SimpleTemplate')
.css('SimpleTemplate.css')
.build(function(template, model){

template.div.class('myDivClass')
	.span.class('mySpanClass').content.bind(model.text).end
	.span.class('myOtherSpanClass').content.text('Static text!').end
.end.finalize;
});

// Translates roughly to:
/*
<div class="mySpanClass">
	<span class="mySpanClass">{{model.text}}</span>
	<span class="myOtherSpanClass">Static text!</span>
</div>

*/
