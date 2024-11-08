
let deleteLayer = () => {
  let formid = document.getElementById('_formid').value;
  console.log(formid);
  axios.post('/api/delete_layer', { formid }).then(r => {
    console.log(r);
    if (r.status) {
      window.location.reload()
    }
  })
}

let showModal = (formid, layername) => {
  document.getElementById('_formid').value = formid;
  document.getElementById('_layername').innerHTML = layername;
  var modal = new bootstrap.Modal(document.getElementById('modal'));
  modal.show();
}

let gotoCreatePage = (formid) => {
  window.location.href = '/_create/index.html?formid=' + formid + '&mode=edit'
}

let listFrom = () => {
  let division = getCookie('lgiadivision');
  let auth = getCookie('lgiaauth');
  axios.post('/api/list_layer_by_division', { auth, division }).then((res) => {
    if (res.data.length > 0)
      res.data.forEach(i => {
        document.getElementById('list_layer').innerHTML += `<div class="card mt-2" >
            <div class="card-body">
              <h5 class="card-title">ชั้นข้อมูล: ${i.layername}</h5>
              <span class="badge rounded-pill bg-primary">ผู้สร้าง: ${i.division}</span>
              <span class="badge rounded-pill bg-info">วันที่สร้าง: ${i.ts}</span>
              <span class="badge rounded-pill bg-light text-dark">เลขอ้างอิง: ${i.formid}</span><p></p>
              <button class="btn btn-warning" onclick="gotoCreatePage('${i.formid}')"><i class="bi bi-plus-circle"></i> เพิ่ม/แก้ไขข้อมูล</button>
              <button class="btn btn-danger" onclick="showModal('${i.formid}', '${i.layername}')"><i class="bi bi-trash3"></i> ลบ</button>
            </div>
          </div>`
      });
  })
}

let btn_confirm_delete = document.getElementById('btn_confirm_delete');
btn_confirm_delete.addEventListener('click', deleteLayer);

window.onload = () => {
  listFrom()
}