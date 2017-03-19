/**
 * Created by Guo on 2017/1/9.
 */
;(function(){
	'user strict';

	var $form_add_task = $('.add-task'),			// 添加任务容器
		$delete_task,								// 删除任务
		$detail_task,								// 任务详细
		$task_detail = $('.task-detail'),			// 默认任务容器
		$task_detail_mask = $('.task-detail-mask'),	// 默认任务蒙版容器
		task_list = [],								// 任务列表
		current_index,								// 当前索引值
		$update_form,								// 更新表单
		$task_detail_content,						// 任务默认内容
		$task_detail_content_input,					// 任务默认内容输入
		$checkbox_complete,							// checkbox状态
		$msg = $('.msg'),							// 消息
		$msg_content = $msg.find('.msg-content'),	// 消息内容
		$confirmed = $msg.find('.confirmed'),		// 提交
		$audio = $('.audio');						// 提示音
	init();											// 初始化			
	$form_add_task.on('submit',addTaskSubmit);	// 添加提交事件，触发addTaskSubmit
	$task_detail_mask.on('click',hideTaskDetail);			// 任务默认蒙版点击事件，触发隐藏

	// 初始化
	function init(){
		// 获取本地任务列表。
		task_list = store.get('task_list') || [];
		// 监听提交事件
		listenConfirmed();
		// 如果本地服务列表有数据，则渲染任务列表。
		if(task_list.length){
			renderTaskList(task_list);
		}
		taskRemindCheck();
	}

	// 添加任务提交
	function addTaskSubmit(e){
		var new_task = {};
		//禁用默认行为
		e.preventDefault();
		//获取新Task的值
		var $input = $(this).find('input[name=content]');
		new_task.content = $input.val();
		//如果新Task值为空，则直接返回，否则继续执行
		if(!new_task.content) return;
		if(addTask(new_task)){
			renderTaskList();
			$input.val(null);
		}
	}

	// 添加任务，任务对象添加到task_list列表，然后使用store存储。
	function addTask(new_task){
		task_list.push(new_task);
		store.set('task_list',task_list);
		return true;
	}

	// 更新任务，然后刷新任务
	function updateTask(index,data){
		if(index == undefined || !task_list[index]) return;
		// 合并本地任务和新加任务。
		task_list[index] = $.extend({},task_list[index],data);
		refreshTaskList();
	}

	// 删除任务 ,删除后刷新任务列表。
	function deleteTask(index){
		if (index === undefined || !task_list[index]) return;
		delete task_list[index];
		refreshTaskList();
	}

	// 显示任务详细，渲染任务详细，任务详细显示，任务详细蒙版显示。
	function showTaskDetail(index){
		renderTaskDetail(index);
		current_index = index;
		$task_detail.show();
		$task_detail_mask.show();
	}

	// 隐藏任务详情，包括蒙版
	function hideTaskDetail(){
		$task_detail.hide();
		$task_detail_mask.hide();
	}
	
	// 监听msg保存事件，点击保存，隐藏msg
	function listenConfirmed(){
		$confirmed.on('click',function(){
			hideMsg();
		});
	}

	// 监听 点击任务详细事件，点击显示任务详细内容。
	function listenTaskDetail(){
		$detail_task.on('click',function(){
			var $this = $(this);
			var $item = $this.parent().parent();
			var index = $item.data('index');
			showTaskDetail(index);
		});
	}

	// 监听 点击删除任务事件，点击删除任务。
	function listenTaskDelete(){
		$delete_task.on('click',function(){
			var $this = $(this);
			var $item = $this.parent().parent();
			var index = $item.data('index');
			deleteTask(index);
		});
	}

	// 监听 Checkbox选中事件，点击更新选中状态。
	function listenCheckboxComplete(){
		$checkbox_complete.on('click',function(){
			var index = $(this).parent().parent().data('index');
			var item = store.get("task_list")[index];
			if(item.complete){
				updateTask(index,{complete:false});
				$(this).prop('checked',false);
			}else{
				updateTask(index,{complete:true});
				$(this).prop('checked',true);
			}

		})
	}

	// 任务提醒
	function taskRemindCheck(){

		// 当前时间，任务时间
		var current_timeatamp,task_timestamp;

		// 定时，遍历所有任务，判断是否提醒过。
		var itl = setInterval(function(){
			for(var i=0 ;i<task_list.length;i++){
				var item = store.get("task_list")[i];

				// 筛选无任务，无提醒日期，已提醒过事项
				if(!item) continue;
				if(!item.remind_date||item.informed) continue;

				current_timeatamp = (new Date()).getTime();		// 当前时间
				task_timestamp = (new Date(item.remind_date)).getTime();  // 提醒时间

				// 判断是否到了提醒时间，true 更新任务已提醒过，显示提示信息。
				if(current_timeatamp - task_timestamp >= 1){
					updateTask(i,{informed:true});
					showMsg(item.content);
				}
			}
		},500);
	}

	// 显示提示信息，提示音播放。
	function showMsg(content){
		$msg_content.html(content);
		$audio.get(0).play();
		$msg.show();
	}

	// 隐藏提示信息
	function hideMsg(){
		$msg.hide();
	}

	// 刷新任务列表，从本地获取，然后渲染到页面上。
	function refreshTaskList() {
		store.set('task_list', task_list);
		renderTaskList();
	}

	// 渲染任务列表
	function renderTaskList(){
		var $task_list = $('.task-list');

		// 每次列表清空
		$task_list.html('');
		// 提醒过列表集合
		var complete_items = [];

		// 渲染未提醒的任务
		for(var i=0;i<task_list.length;i++){
			if(task_list[i] == null) continue;
			if(task_list[i] &&　task_list[i].complete){
				complete_items[i] = task_list[i];
			}else{
				var $task = renderTaskHtml(task_list[i],i);
			}
			$task_list.prepend($task);
		}

		// 渲染提醒过的任务
		for(var j=0;j<complete_items.length;j++){
			var $task_c = renderTaskHtml(complete_items[j],j);
			if (!$task_c) continue;
			$task_c.addClass('completed');
			$task_list.append($task_c);
		}

		// 获取列表删除、详细、选择框DOM节点
		$delete_task = $('.action.delete');
		$detail_task = $('.action.detail');
		$checkbox_complete = $('.task-list .complete');

		// 监听删除、详细、选择框选中
		listenTaskDetail();
		listenTaskDelete();
		listenCheckboxComplete();
	}

	//渲染指定详细信息
	function renderTaskDetail(index){
		if(index === undefined || !task_list[index])
			return;
		var item = task_list[index];
		var html = '<form><div class="content">' +
				(item.content || '') +
				'</div>' +
				'<div><input style="display:none;" type="text" name="content" value="'+item.content+'"></div>' +
				'<div class="desc">' +
				'<textarea name="desc">'+(item.desc || '')+'</textarea>' +
				'</div>' +
				'<div class="remind">' +
				'<input class="datatime" name="remind_date" type="text" value="'+(item.remind_date || '')+'">' +
				'</div>' +
				'<div><button type="submit">更新</button></div>' +
				'</form>';
		// 先清空，后添加
		$task_detail.html(null);
		$task_detail.html(html);

		$('.datatime').datetimepicker();

		$update_form = $task_detail.find('form');
		$task_detail_content = $update_form.find('.content');
		$task_detail_content_input = $update_form.find('[name=content]');

		// 任务标题双击可更改
		$task_detail_content.on('dblclick',function(e){
			$task_detail_content_input.show();
			$task_detail_content.hide();
		});

		// 监听任务详情表单提交，更新任务列表，隐藏任务详情
		$update_form.on('submit',function(e){
			e.preventDefault();
			var data = {};
			data.content = $(this).find('[name=content]').val();			// 任务标题内容
			data.desc = $(this).find('[name=desc]').val();					// 任务顺序
			data.remind_date = $(this).find('[name=remind_date]').val();	// 任务提醒日期
			updateTask(index,data);	
			hideTaskDetail();
		})
	}

	// 渲染任务HTML结构
	function renderTaskHtml(data,index){
		if (!data || (!index && index!=0)) return;
		var list_item_html =
				'<div class="task-item" data-index="'+index+'">'+
				'<span><input class="complete" ' + (data.complete ? 'checked' : '') + ' type="checkbox"></span>'+
				'<span class="task-content">'+data.content+'</span>'+
				'<span class="fr">' +
				'<span class="action delete"> 删除</span>'+
				'<span class="action detail"> 详细</span>' +
				'</span></div>';
		return $(list_item_html);
	}
})();
