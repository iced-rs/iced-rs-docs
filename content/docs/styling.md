+++
title = "Styling"
weight = 1
+++

# Introduction

`Iced` is a Rust GUI framework which targets a variety of platforms: `Web`, `Windows`, `MacOSX` and `Linux`. While each target has its own approach to rendering, the layout and styling model should be agnostic to the platform itself. `Iced`, being heavily influenced by the `Elm` language, incorporates many of the common patterns seen in HTML and CSS. This includes the declarative nature of HTML itself with the concept of `Element` and styling rules, some synonymous with CSS (e.g. `padding` and `background_color`). However, there are caveats. `CSS` is a standard that has evolved for over 24 years and it has adapted by making design decisions that are not necessarily consistent(I don't know how to say this nicely???). This page will discuss the `Iced` styling standard and how it differs from traditional `CSS`.  
