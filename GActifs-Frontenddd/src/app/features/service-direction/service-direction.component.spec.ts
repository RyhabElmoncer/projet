import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceDirectionComponent } from './service-direction.component';

describe('ServiceDirectionComponent', () => {
  let component: ServiceDirectionComponent;
  let fixture: ComponentFixture<ServiceDirectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceDirectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceDirectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
