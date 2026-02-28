import { AppLayout } from '../../templates/AppLayout/AppLayout'

export function ManualPage() {
  return (
    <AppLayout>
      <div className="nk-block">
        <div className="card card-full">
          <div className="card-inner">
            <h5 className="title mb-4">คู่มือการใช้งาน LGIA</h5>

            <div className="accordion" id="manualAccordion">
              {MANUAL_SECTIONS.map((section, i) => (
                <div className="accordion-item" key={i}>
                  <h6 className="accordion-header">
                    <button
                      className={`accordion-button ${i > 0 ? 'collapsed' : ''}`}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#manual-${i}`}
                    >
                      {section.title}
                    </button>
                  </h6>
                  <div
                    id={`manual-${i}`}
                    className={`accordion-collapse collapse ${i === 0 ? 'show' : ''}`}
                    data-bs-parent="#manualAccordion"
                  >
                    <div className="accordion-body" style={{ fontSize: 'var(--text-sm)', lineHeight: 1.8 }}>
                      {section.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

const MANUAL_SECTIONS = [
  {
    title: 'การเข้าสู่ระบบ',
    content: 'เข้าสู่ระบบด้วย Username/Password หรือผ่าน LINE Login โดยกดปุ่ม Login ที่มุมขวาบน',
  },
  {
    title: 'การสร้างชั้นข้อมูล',
    content: 'ไปที่เมนู "สร้างชั้นข้อมูล" เลือกหน่วยงาน ตั้งชื่อชั้นข้อมูล เลือกประเภท (Point/LineString/Polygon) และกำหนดคอลัมน์ข้อมูล',
  },
  {
    title: 'การนำเข้าข้อมูล CSV',
    content: 'ไปที่เมนู "นำเข้าข้อมูล CSV" เลือกชั้นข้อมูลที่ต้องการ จากนั้นอัปโหลดไฟล์ CSV ตามรูปแบบที่กำหนด',
  },
  {
    title: 'การดูรายงานบนแผนที่',
    content: 'ไปที่เมนู "รายงาน" เลือกชั้นข้อมูลจากแผงด้านขวา ระบบจะแสดงข้อมูลบนแผนที่และตารางด้านล่าง',
  },
]
