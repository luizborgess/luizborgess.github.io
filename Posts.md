---
layout: page
title: Posts
---
<ul>
  {% for post in site.posts %}
    <li>


<div style="width: 25%; float:left">
      <img src="{{post.image}}" width="160" height="90"><img/>

</div>


<div style="width: 75%; float:right">
<a href="{{ post.url }}">{{ post.title }}
<br />
Date: {{ post.date | date_to_string }}
</a>
</div>
</li>
<p></p>
  {% endfor %}
</ul>