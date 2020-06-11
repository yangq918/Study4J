<?php
use OSS\Core\OssException;
/**
 * 上传附件和上传视频
 * User: Jinqn
 * Date: 14-04-09
 * Time: 上午10:17
 */
include "Uploader.class.php";
include "UploadOss.class.php";
include "ossconfig.php";
/* 上传配置 */
$base64 = "upload";
switch (htmlspecialchars($_GET['action'])) {
	case 'inputarticle':
		include 'InputUrl.class.php';
		$data['url'] = $_POST['url'];
		$config = array(
				'ossAccessId'=>$ossconfig['ossAccessId'],
				'ossSecretKey'=>$ossconfig['ossSecretKey'],
				'ossServer'=>$ossconfig['ossServerInternal'],
				'ossBucket'=>$ossconfig['ossBucket'],
				'ossServer'=>$ossconfig['ossServer'],
				'ossConfig'=>$ossconfig['ossConfig'],
		);
		$input = new InputAticle($config);
		$res = $input->input($data['url']);
		return $res;
		break;
    case 'uploadimage':
        $config = array(
            "pathFormat" => $CONFIG['imagePathFormat'],
            "maxSize" => $CONFIG['imageMaxSize'],
            "allowFiles" => $CONFIG['imageAllowFiles'],
            'ossAccessId'=>$ossconfig['ossAccessId'],
            'ossSecretKey'=>$ossconfig['ossSecretKey'],
            'ossServer'=>$ossconfig['ossServerInternal'],
            'ossBucket'=>$ossconfig['ossBucket'],
            'ossServer'=>$ossconfig['ossServer'],
        );
        $fieldName = $CONFIG['imageFieldName'];
        break;
    case 'uploadscrawl':
        $config = array(
            "pathFormat" => $CONFIG['scrawlPathFormat'],
            "maxSize" => $CONFIG['scrawlMaxSize'],
            "allowFiles" => $CONFIG['scrawlAllowFiles'],
            "oriName" => "scrawl.png"
        );
        $fieldName = $CONFIG['scrawlFieldName'];
        $base64 = "base64";
        break;
    case 'uploadvideo':
        $config = array(
            "pathFormat" => $CONFIG['videoPathFormat'],
            "maxSize" => $CONFIG['videoMaxSize'],
            "allowFiles" => $CONFIG['videoAllowFiles'],
            'ossAccessId'=>$ossconfig['ossAccessId'],
            'ossSecretKey'=>$ossconfig['ossSecretKey'],
            'ossServer'=>$ossconfig['ossServerInternal'],
            'ossBucket'=>$ossconfig['ossBucket'],
            'ossServer'=>$ossconfig['ossServer'],
        );
        $fieldName = $CONFIG['videoFieldName'];
        break;
    case 'uploadfile':
    	$config = array(
    			"pathFormat" => $CONFIG['filePathFormat'],
    			"maxSize" => $CONFIG['fileMaxSize'],
    			"allowFiles" => $CONFIG['fileAllowFiles'],
    			'ossAccessId'=>$ossconfig['ossAccessId'],
    			'ossSecretKey'=>$ossconfig['ossSecretKey'],
    			'ossServer'=>$ossconfig['ossServerInternal'],
    			'ossBucket'=>$ossconfig['ossBucket'],
    			'ossServer'=>$ossconfig['ossServer'],
    	);
    	$fieldName = $CONFIG['fileFieldName'];
    	break;
    case 'makeimage':
    	break;
    default:
        $config = array(
            "pathFormat" => $CONFIG['filePathFormat'],
            "maxSize" => $CONFIG['fileMaxSize'],
            "allowFiles" => $CONFIG['fileAllowFiles']
        );
        $fieldName = $CONFIG['fileFieldName'];
        break;
}
// $up = new Uploader($fieldName, $config, $base64);
if (isset($ossconfig['ossConfig']) && $ossconfig['ossConfig'] ) {
	$ossClient = new UploadOSS($fieldName, $config);
	$res = $ossClient->upload($config['ossBucket']);
	$response = $ossClient->getFileInfo();
	return json_encode($response);
}else {
	/* 生成上传实例对象并完成上传 */
	$up = new Uploader($fieldName, $config, $base64);
	/* 返回数据 */
	return json_encode($up->getFileInfo());
}

/**
 * 得到上传文件所对应的各个参数,数组结构
 * array(
 *     "state" => "",          //上传状态，上传成功时必须返回"SUCCESS"
 *     "url" => "",            //返回的地址
 *     "title" => "",          //新文件名
 *     "original" => "",       //原始文件名
 *     "type" => ""            //文件类型
 *     "size" => "",           //文件大小
 * )
 */

/**
 * curl访问
 * @param unknown $post_url
 * @param unknown $data
 * @param unknown $header
 * @param string $cookie
 * @param number $timeout
 * @param string $charset
 * @return string
 */
function curl_post($post_url, $data = array(), $header = array(), $cookie = '', $timeout = 30, $charset = 'utf-8') {
	$ch = curl_init ();
	curl_setopt ( $ch, CURLOPT_URL, $post_url );
	curl_setopt ( $ch, CURLOPT_POST, true );
	curl_setopt ( $ch, CURLOPT_RETURNTRANSFER, true );
	curl_setopt ( $ch, CURLOPT_HEADER, false );
	curl_setopt ( $ch, CURLOPT_HTTPHEADER, $header );
	curl_setopt ( $ch, CURLINFO_HEADER_OUT, false );
	curl_setopt ( $ch, CURLOPT_TIMEOUT, $timeout );
	curl_setopt ( $ch, CURLOPT_COOKIE, $cookie );
	curl_setopt ( $ch, CURLOPT_POSTFIELDS, $data );
	$result = curl_exec ( $ch );
	if ($result === false) {
		return curl_error ( $ch );
	}
	curl_close ( $ch );
	return trim ( $result );
}
