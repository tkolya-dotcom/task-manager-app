// New showPRDetail function with edit functionality for purchase requests
// Replace the existing showPRDetail function in index.html with this code:

async function showPRDetail(prId) {
    // Fetch purchase request with simple select
    const { data: pr } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('id', prId)
        .single();

    if (!pr) return;

    // Fetch related data
    let creatorName = 'Unknown';
    let approverName = null;
    let taskTitle = null;
    let installationTitle = null;

    if (pr.created_by) {
        const { data: creator } = await supabase
            .from('users')
            .select('name')
            .eq('id', pr.created_by)
            .single();
        creatorName = creator?.name || 'Unknown';
    }

    if (pr.approved_by) {
        const { data: approver } = await supabase
            .from('users')
            .select('name')
            .eq('id', pr.approved_by)
            .single();
        approverName = approver?.name || null;
    }

    if (pr.task_id) {
        const { data: task } = await supabase
            .from('tasks')
            .select('title')
            .eq('id', pr.task_id)
            .single();
        taskTitle = task?.title || null;
    }

    if (pr.installation_id) {
        const { data: installation } = await supabase
            .from('installations')
            .select('title')
            .eq('id', pr.installation_id)
            .single();
        installationTitle = installation?.title || null;
    }

    const { data: items } = await supabase
        .from('purchase_request_items')
        .select('*')
        .eq('purchase_request_id', prId);

    const isManager = currentUserProfile?.role === 'manager';
    const isOwner = String(pr.created_by) === String(currentUserProfile?.id);
    const canApprove = isManager && pr.status === 'pending';
    const canEdit = isOwner && (pr.status === 'rejected' || pr.status === 'draft');

    const itemType = taskTitle ? 'Задача: ' + taskTitle : (installationTitle ? 'Монтаж: ' + installationTitle : '');

    let html = `
        <button class="btn btn-outline btn-sm" onclick="navigate('purchaseRequests')" style="margin-bottom: 16px">← Назад</button>
        <div class="detail-header">
            <div class="detail-title">Заявка #${prId.slice(0, 8)}</div>
            <div class="detail-meta">${itemType}</div>
            <div class="detail-meta">Статус: <span class="status status-${pr.status}">${getPRStatusLabel(pr.status)}</span></div>
            <div class="detail-meta">Создал: ${creatorName}</div>
            ${approverName ? `<div class="detail-meta">Подтвердил: ${approverName}</div>` : ''}
            ${pr.comment ? `<div class="detail-meta" style="color: ${pr.status === 'rejected' ? 'var(--danger)' : 'var(--gray)'}"><strong>Комментарий:</strong> ${pr.comment}</div>` : ''}
        </div>
    `;

    if (items && items.length > 0) {
        html += `<h3 class="section-title">Позиции</h3>`;
        items.forEach(item => {
            html += `
                <div class="pr-item">
                    <div>
                        <div class="pr-item-name">${item.name}</div>
                        ${item.note ? `<div style="font-size: 12px; color: var(--gray)">${item.note}</div>` : ''}
                    </div>
                    <div class="pr-item-qty">${item.quantity} ${item.unit}</div>
                </div>
            `;
        });
    }

    // Manager can approve/reject
    if (canApprove) {
        html += `
            <div class="actions">
                <button class="btn btn-success" onclick="approvePR('${pr.id}')">Одобрить</button>
                <button class="btn btn-danger" onclick="rejectPR('${pr.id}')">Отклонить</button>
            </div>
        `;
    }
    
    // Worker can edit and resubmit if rejected
    if (canEdit) {
        html += `
            <button class="btn btn-warning" onclick="editPR('${pr.id}')">Редактировать и отправить на рассмотрение</button>
        `;
    }

    document.getElementById('content').innerHTML = html;
}

// Add these helper functions after showPRDetail:

window.editPR = async function(prId) {
    // Fetch current PR items
    const { data: items } = await supabase
        .from('purchase_request_items')
        .select('*')
        .eq('purchase_request_id', prId);
    
    // Fetch materials for dropdown
    const { data: materials } = await supabase
        .from('materials')
        .select('*')
        .order('category')
        .order('name');
    
    const materialOptions = materials?.map(m => 
        `<option value="${m.id}" data-name="${m.name}" data-unit="${m.default_unit}">${m.name} (${m.category})</option>`
    ).join('') || '';
    
    let itemsHtml = '';
    if (items && items.length > 0) {
        items.forEach((item, index) => {
            const num = index + 1;
            itemsHtml += `
                <div id="editPrItem${num}">
                    <div class="form-group">
                        <label>Позиция ${num} - Материал</label>
                        <select id="editItem${num}Material" class="form-group" onchange="handleEditMaterialSelect(${num})">
                            <option value="">-- Выберите материал --</option>
                            ${materialOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Название (если свое)</label>
                        <input id="editItem${num}Name" type="text" placeholder="Название материала" value="${item.name || ''}">
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <div class="form-group" style="flex: 1;">
                            <label>Количество</label>
                            <input id="editItem${num}Qty" type="number" placeholder="1" value="${item.quantity || 1}">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>Единица</label>
                            <select id="editItem${num}Unit">
                                <option value="pcs" ${item.unit === 'pcs' ? 'selected' : ''}>шт</option>
                                <option value="m" ${item.unit === 'm' ? 'selected' : ''}>м</option>
                                <option value="m2" ${item.unit === 'm2' ? 'selected' : ''}>м2</option>
                                <option value="m3" ${item.unit === 'm3' ? 'selected' : ''}>м3</option>
                                <option value="l" ${item.unit === 'l' ? 'selected' : ''}>л</option>
                                <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>кг</option>
                                <option value="box" ${item.unit === 'box' ? 'selected' : ''}>кор</option>
                                <option value="pack" ${item.unit === 'pack' ? 'selected' : ''}>уп</option>
                                <option value="set" ${item.unit === 'set' ? 'selected' : ''}>набор</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Примечание</label>
                        <input id="editItem${num}Note" type="text" placeholder="Примечание (необязательно)" value="${item.note || ''}">
                    </div>
                </div>
            `;
        });
    }
    
    showModal('Редактировать заявку', `
        <div id="editPrItems">
            ${itemsHtml}
        </div>
        <button class="btn btn-outline" onclick="addEditPRItem()" style="margin-bottom: 12px">+ Добавить позицию</button>
        <button class="btn" onclick="saveEditedPR('${prId}')">Отправить на рассмотрение</button>
    `);
};

window.addEditPRItem = function() {
    const container = document.getElementById('editPrItems');
    const count = container.children.length + 1;
    
    supabase.from('materials').select('*').order('category').order('name')
        .then(({ data: materials }) => {
            const materialOptions = materials?.map(m => 
                `<option value="${m.id}" data-name="${m.name}" data-unit="${m.default_unit}">${m.name} (${m.category})</option>`
            ).join('') || '';
            
            const div = document.createElement('div');
            div.innerHTML = `
                <hr style="margin: 16px 0;">
                <div class="form-group">
                    <label>Позиция ${count} - Материал</label>
                    <select id="editItem${count}Material" class="form-group" onchange="handleEditMaterialSelect(${count})">
                        <option value="">-- Выберите материал --</option>
                        ${materialOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Название (если свое)</label>
                    <input id="editItem${count}Name" type="text" placeholder="Название материала">
                </div>
                <div style="display: flex; gap: 8px;">
                    <div class="form-group" style="flex: 1;">
                        <label>Количество</label>
                        <input id="editItem${count}Qty" type="number" placeholder="1" value="1">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>Единица</label>
                        <select id="editItem${count}Unit">
                            <option value="pcs">шт</option>
                            <option value="m">м</option>
                            <option value="m2">м2</option>
                            <option value="m3">м3</option>
                            <option value="l">л</option>
                            <option value="kg">кг</option>
                            <option value="box">кор</option>
                            <option value="pack">уп</option>
                            <option value="set">набор</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Примечание</label>
                    <input id="editItem${count}Note" type="text" placeholder="Примечание (необязательно)">
                </div>
            `;
            container.appendChild(div);
        });
};

window.handleEditMaterialSelect = function(itemNum) {
    const select = document.getElementById('editItem' + itemNum + 'Material');
    const nameInput = document.getElementById('editItem' + itemNum + 'Name');
    const unitSelect = document.getElementById('editItem' + itemNum + 'Unit');
    
    if (select && select.selectedOptions[0]) {
        const option = select.selectedOptions[0];
        const name = option.getAttribute('data-name');
        const unit = option.getAttribute('data-unit');
        
        if (nameInput && (!nameInput.value || nameInput.value === name)) {
            nameInput.value = name;
        }
        if (unitSelect && unit) {
            unitSelect.value = unit;
        }
    }
};

window.saveEditedPR = async function(prId) {
    const container = document.getElementById('editPrItems');
    const items = [];
    
    let i = 1;
    while (document.getElementById('editItem' + i + 'Name')) {
        const name = document.getElementById('editItem' + i + 'Name').value;
        const quantity = parseFloat(document.getElementById('editItem' + i + 'Qty').value) || 1;
        const unit = document.getElementById('editItem' + i + 'Unit').value;
        const note = document.getElementById('editItem' + i + 'Note').value;
        
        if (name) {
            items.push({ name, quantity, unit, note });
        }
        i++;
    }
    
    if (items.length === 0) {
        showToast('Добавьте хотя бы одну позицию');
        return;
    }
    
    try {
        // Delete old items
        await supabase.from('purchase_request_items').delete().eq('purchase_request_id', prId);
        
        // Create new items
        const itemsData = items.map(item => ({
            purchase_request_id: prId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            note: item.note
        }));
        
        await supabase.from('purchase_request_items').insert(itemsData);
        
        // Update PR status to pending
        await supabase
            .from('purchase_requests')
            .update({ 
                status: 'pending',
                comment: null,
                updated_at: new Date().toISOString() 
            })
            .eq('id', prId);
        
        closeModal();
        showToast('Заявка отправлена на рассмотрение');
        showPRDetail(prId);
    } catch (error) {
        showToast('Ошибка: ' + error.message);
    }
};
