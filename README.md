# Responsive Video Slider #

Check out the documentation @ http://fooplugins.github.io/rvslider/

## Basic Usage ##

First [download the required JS and CSS files](http://fooplugins.github.io/rvslider/releases/rvslider.latest.zip) and include them in your page.
```html
<link href="rvslider.min.css" rel="stylesheet" />
<script src="rvslider.min.js"></script>
```

Then include the following JS script in your page or add it into your own page ready function to initialize the plugin.
```html
<script>
	jQuery(function($){
		$('.rvs-container').rvslider();
	});
</script>
```

Once that is setup all that is left to do is provide the plugin with [the HTML it requires](http://fooplugins.github.io/rvslider/docs/getting-started.html#html-structure). You can create this markup yourself however you like, server side or client side*, or simply use [the generator](http://fooplugins.github.io/rvslider/docs/generator.html) to create your slider and items and simply copy the code into your page.

** Note generating the HTML client side would require the plugin initializer to only be called after all HTML content is added to the page.  

## Change Log ##

<table>
<tr><th>Version</th><th>Description</th></tr>
<tr>
<td>1.0.0</td>
<td>Initial release.</td>
</tr>
<tr>
<td>1.0.1</td>
<td>Added Dailymotion support.</td>
</tr>
<tr>
<td>1.0.2</td>
<td>
<ul>
<li>Minor CSS hardening.</li>
<li>Added MIT license.</li>
<li>Updated Grunt build to read all version strings from the package.json.</li>
</ul>
</td>
</tr>
<tr>
<td>1.0.3</td>
<td>
<ul>
<li>Changed the plugin to use the parent width instead of the viewport to determine layout.</li>
<li>Switched CSS media queries to JS breakpoints to be able to use parent width.</li>
<li>Added additional CSS hardening.</li>
<li>Minor bug fixes.</li>
</ul>
</td>
</tr>
<tr>
<td>1.0.4</td>
<td>
<ul>
<li>Removed mediaelement.js dependency and instead rely on HTML5's VIDEO element for direct video urls (.mp4,.ogv,.webm).</li>
<li>Added error handling for direct video urls (.mp4,.ogv,.webm)</li>
<li>Changed xs breakpoint from 320 to 480.</li>
<li>Disabled text selection on nav items</li>
<li>Added additional CSS hardening.</li>
</ul>
</td>
</tr>
<tr>
<td>1.0.5</td>
<td>Changed to GPLv3 license</td>
</tr>
<tr>
<td>1.0.6</td>
<td>Removed transition-delay from rvs-item-text and rvs-item-content transitions as it was causing PageSpeed Insights parsing engine to fail. Changed things around a little to achieve the same effect using the trnasitionend event in JS.</td>
</tr>
<tr>
<td>1.0.7</td>
<td>
<ul>
<li>Added in some additional play icon styles.</li>
<li>Changed the navigation mouse wheel behaviour so that if there are no items to scroll to the event is not captured.</li>
</ul>
</td>
</tr>
</table>