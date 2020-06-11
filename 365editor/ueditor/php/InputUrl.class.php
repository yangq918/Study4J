<?php
/**
 * Created by JetBrains PhpStorm.
 * User: lalala
 * Date: 18-4-12
 * Time: 上午11: 32
 * 导入文章
 */
use OSS\Core\OssException;
class InputAticle {
	private $dirname;
	private $error = [ 
			'mkdirfail' => '目录创建失败',
			'nowrite' => '没有写权限' 
	];
	private $ossconfig;
	private $status;
	private $ossClient;
	private $bucket;
	private $osshost;
	private $ossUrl;
	public function __construct($config) {
		$this->osshost = $config['ossServer'];
		$this->bucket = $config['ossBucket'];
		$this->ossconfig = $config ['ossConfig'];
		if ($config ['ossConfig']) {
			try {
				$this->ossClient = new \OSS\OssClient ( $config ['ossAccessId'], $config ['ossSecretKey'], $config ['ossServer'] );
			} catch ( OssException $e ) {
				$this->assertTrue ( false );
			}
		} else {
			$this->ossconfig = false;
		}
		$this->dirname = '/ueditor/php/upload/image/' . date ( 'Ymd' ) . '/';
	}
	public function input($url) {
		if (empty ( $url )) {
			$response = [ 
					'code' => 'F',
					'msg' => '请填写正确的链接' 
			];
			return json_encode ( $response );
		}
		$htmlStr = self::curl_urlcontent ( $url );
		if (! $htmlStr) {
			$htmlStr = file_get_contents ( $url );
		}
		$html = new \DOMDocument ();
		libxml_use_internal_errors ( true );
		$html->validateOnParse = true;
		$html->loadHTML ( $htmlStr );
		$html->preserveWhiteSpace = false;
		// 文章主体内容
		$contentDoc = $this->getContent ( $html );
		if (! $contentDoc) {
			$response = [ 
					'code' => 'F',
					'msg' => '未获取到文章内容' 
			];
			return json_encode ( $response );
		}
		// 获取文章信息
		$info = $this->getArticleMessage ( $htmlStr );
		// 处理文章中的图片
		$info ['content'] = $this->setImgAttriBute ( $contentDoc );
		$info ['img'] = $this->imgArr;
		$response = [ 
				'code' => 'S',
				'msg' => $info 
		];
		return json_encode ( $response );
	}
	/**
	 * 获取主题内容html
	 *
	 * @param unknown $html        	
	 * @return unknown
	 */
	public function getContent($html) {
		$content = $html->getElementById ( 'js_content' );
		if (empty ( $content )) {
			return false;
		}
		$contentHtml = $html->saveHTML ( $content );
		return $contentHtml;
	}
	/**
	 * 获取文章内容
	 *
	 * @param unknown $html        	
	 * @return number
	 */
	public function getArticleMessage($html) {
		// 标题
		preg_match_all ( '/var msg_title = "([\s\S]+?)"/', $html, $title );
		$message ['title'] = $title [1] [0] ? $title [1] [0] : 0;
		// 封面
		preg_match_all ( '/var msg_cdn_url = "([\s\S]+?)"/', $html, $cover );
		$cover = $cover [1] [0] ? $cover [1] [0] : 0;
		// 摘要
		preg_match_all ( '/var msg_desc = "([\s\S]+?)"/', $html, $summary );
		$message ['summary'] = $summary [1] [0] ? $summary [1] [0] : 0;
		// 昵称
		preg_match_all ( '/var nickname = "([\s\S]+?)"/', $html, $nickname );
		$message ['nickname'] = $nickname [1] [0] ? $nickname [1] [0] : 0;
		// 发布时间
		preg_match_all ( '/var publish_time = "([\s\S]+?)"/', $html, $pushtime );
		$message ['pushtime'] = $pushtime [1] [0] ? $pushtime [1] [0] : 0;
		return $message;
	}
	/**
	 * 解析内容中的文章
	 *
	 * @param unknown $content        	
	 * @return Unknown
	 */
	public function setImgAttriBute($content) {
		$contentDoc = new \DOMDocument ();
		libxml_use_internal_errors ( true );
		$contentDoc->validateOnParse = true;
		$contentDoc->loadHTML ( '<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>' . $content );
		$contentDoc->preserveWhiteSpace = false;
		// section 标签内的style
		$sectionTags = $contentDoc->getElementsByTagName ( 'section' );
		if (! empty ( $sectionTags->length )) {
			foreach ( $sectionTags as $section ) {
				$sectionStyle = $section->getAttribute ( 'style' );
				preg_match_all ( '/background-image: url\(([\s\S]+?)\)/', $sectionStyle, $styleImgUrl );
				if (! empty ( $styleImgUrl [1] [0] )) {
					preg_match_all ( '/\"([\s\S]+?)\"/', $styleImgUrl [1] [0], $styleImg ); // 判断有没有双引号
					preg_match_all ( '/\'([\s\S]+?)\'/', $styleImgUrl [1] [0], $styleImgother ); // 判断有没有单引号
					if (! empty ( $styleImg [1] [0] )) {
						$imgUrl = $styleImg [1] [0];
					} elseif (! empty ( $styleImgother [1] [0] )) {
						$imgUrl = $styleImgother [1] [0];
					} else {
						$imgUrl = $styleImgUrl [1] [0];
					}
					$styleImg = self::curl_urlcontent ( $imgUrl );
					$type = self::check_image_type ( $styleImg );
					if (! $type) {
						continue;
					}
					$styleNode [] = self::makeImage ( $type, $styleImg, $this->ossconfig );
				}
			}
			if (isset ( $styleNode )) {
				$j = 0;
				// $i = 0;
				foreach ( $sectionTags as $section ) {
					$sectionStyle = $section->getAttribute ( 'style' );
					preg_match_all ( '/background-image: url\(([\s\S]+?)\)/', $sectionStyle, $styleImgUrl );
					if (! empty ( $styleImgUrl [1] [0] )) {
						$replaceStyle = preg_replace ( '/background-image: url\(([\s\S]+?)\)/', 'background-image: url(' . $styleNode [$j] . ')', $sectionStyle );
						$section->setAttribute ( 'style', $replaceStyle );
						$this->imgArr [] = $styleNode [$j];
						$j ++;
					}
				}
			}
		}
		// 读取img标签
		$imgTags = $contentDoc->getElementsByTagName ( 'img' );
		$nodes = [ ];
		foreach ( $imgTags as $val ) {
			$dataSrc = $val->getAttribute ( 'data-src' );
			if (empty ( $dataSrc )) {
				$dataSrc = $val->getAttribute ( 'src' );
			}
			$img = self::curl_urlcontent ( $dataSrc );
			$type = self::check_image_type ( $img );
			if (! $type) {
				continue;
			}
			$nodes [] = self::makeImage ( $type, $img, $this->ossconfig );
		}
		if (isset ( $nodes )) {
			$i = 0;
			foreach ( $imgTags as $val ) {
				if ($val->hasAttribute ( 'data-src' )) {
					$val->setAttribute ( 'data-src', $nodes [$i] );
					$val->setAttribute ( 'src', $nodes [$i] );
					// $this->delfile ( $nodes[$i] );
					$i ++;
				}
			}
		}
		// 视频
		$vdieo = $contentDoc->getElementsByTagName ( 'iframe' );
		if ($vdieo->length) {
			foreach ( $vdieo as $item ) {
				$vdieoSrc = $item->getAttribute ( 'data-src' );
				if (empty ( $vdieoSrc )) {
					$vdieoSrc = $item->getAttribute ( 'src' );
				}
				$item->setAttribute ( 'src', $vdieoSrc );
			}
		}
		$html = $contentDoc->saveHTML ();
		return $html;
	}
	/**
	 * 模拟浏览器访问
	 *
	 * @param unknown $url        	
	 * @return mixed
	 */
	public static function curl_urlcontent($url) {
		$ch = curl_init ();
		$timeout = 10; // set to zero for no timeout
		curl_setopt ( $ch, CURLOPT_URL, $url );
		curl_setopt ( $ch, CURLOPT_RETURNTRANSFER, 1 );
		curl_setopt ( $ch, CURLOPT_SSL_VERIFYPEER, false );
		curl_setopt ( $ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.96 Safari/537.36' );
		curl_setopt ( $ch, CURLOPT_CONNECTTIMEOUT, $timeout );
		$html = curl_exec ( $ch );
		$code = curl_getinfo ( $ch, CURLINFO_HTTP_CODE );
		if ($code != '404') {
			return $html;
		} else {
			return false;
		}
		curl_close ( $ch );
	}
	/**
	 * 上传文件至阿里云oss
	 *
	 * @param unknown $ossKey        	
	 * @param unknown $filePath        	
	 * @param unknown $options        	
	 * @return \Aliyun\OSS\Models\PutObjectResult
	 */
	public function upload($bucket, $filepath,$filename,$options = []) {
		try {
			$object = date ( 'His' ) . $filename;
			$res = $this->ossClient->uploadFile ( $bucket, $object, $filepath, $options );
		} catch ( OssException $e ) {
			return $e->getMessage ();
		}
		$this->ossUrl = $this->osshost . '/' . $bucket . '/' . $object;
		return $this->ossUrl;
	}
	/**
	 * 检查图片格式
	 *
	 * @param mixed $image        	
	 * @return string
	 */
	static public function check_image_type($image) {
		$bits = array (
				'jpeg' => "\xFF\xD8\xFF",
				'gif' => "GIF",
				'png' => "\x89\x50\x4e\x47\x0d\x0a\x1a\x0a",
				'bmp' => 'BM' 
		);
		foreach ( $bits as $type => $bit ) {
			if (substr ( $image, 0, strlen ( $bit ) ) === $bit) {
				return $type;
			}
		}
		return false;
	}
	/**
	 * 生成临时图片
	 *
	 * @param string $type        	
	 * @param unknown $img        	
	 * @return boolean string
	 */
	public function makeImage($type = '', $img = '', $ossconfig = false) {
		if (empty ( $type ) || empty ( $img )) {
			return false;
		}
		// 创建目录失败
		if (! file_exists ( $_SERVER ['DOCUMENT_ROOT'] . $this->dirname ) && ! mkdir ( $_SERVER ['DOCUMENT_ROOT'] . $this->dirname, 0777, true )) {
			$this->status = $this->error ['mkdirfail'];
		} else if (! is_writeable ( $_SERVER ['DOCUMENT_ROOT'] . $this->dirname )) {
			$this->status = $this->error ['nowrite'];
		}
		$filename = time () . rand ( 100000, 999999 ) . '.' . $type;
		$filepath = $_SERVER ['DOCUMENT_ROOT'] . $this->dirname . $filename;
		$file = file_put_contents ( $filepath, $img );
		if ($ossconfig) {
			$res = $this->upload($this->bucket,$filepath,$filename);
			$this->delfile($filepath);
			return $res;
		}
		if (! $file) {
			return $this->status;
		}
		return $this->dirname . $filename;
	}
	/**
	 * 删除临时图片
	 *
	 * @param unknown $url        	
	 * @return boolean
	 */
	public function delfile($url) {
		if (file_exists ( $_SERVER ['DOCUMENT_ROOT'] . $url ) && is_file ( $_SERVER ['DOCUMENT_ROOT'] . $url )) {
			if (unlink ( $_SERVER ['DOCUMENT_ROOT'] . $url )) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
}