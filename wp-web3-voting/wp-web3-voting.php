<?php
/**
 * Plugin Name: Web3 Voting
 * Description: A Web3 voting interface using React and a smart contract.
 * Version: 1.0
 * Author: Jigang Guo
 */

defined('ABSPATH') || exit;

// 注册短代码 [web3_voting]
function wp_web3_voting_render() {
    return '<div id="web3-voting-root"></div>';
}
add_shortcode('web3_voting', 'wp_web3_voting_render');

// 延迟加载资源，仅在使用了短代码的页面加载
function wp_web3_voting_maybe_enqueue_assets() {
    global $post;

    if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'web3_voting')) {
        $build_path = plugin_dir_path(__FILE__) . 'build/assets/';
        $build_url  = plugin_dir_url(__FILE__) . 'build/assets/';

        // 加载 JS
        $js_files = glob($build_path . 'index-*.js');
        if (!empty($js_files)) {
            $js_file = basename($js_files[0]);
            wp_enqueue_script('web3-voting-js', $build_url . $js_file, [], null, true);
        }

        // 加载 CSS
        $css_files = glob($build_path . 'index-*.css');
        if (!empty($css_files)) {
            $css_file = basename($css_files[0]);
            wp_enqueue_style('web3-voting-css', $build_url . $css_file, [], null);
        }
    }
}
add_action('wp_enqueue_scripts', 'wp_web3_voting_maybe_enqueue_assets');
