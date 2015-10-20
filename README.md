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
</table>