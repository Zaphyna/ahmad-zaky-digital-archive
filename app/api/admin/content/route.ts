import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {session} from '@/lib/auth';

const A=['poems','photography','experiences','organizations','projects','achievements','timeline_events','skills','social_links','translations','site_settings'];
function slug(s:string){return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function back(t:string){return `/admin/${t}`}

export async function POST(r:Request){
  if(!await session()) return new NextResponse('Unauthorized',{status:401});
  const f=await r.formData(), t=String(f.get('table')||'');
  if(!A.includes(t)) return new NextResponse('Invalid table',{status:400});
  const sql=db(); if(!sql) return new NextResponse('DATABASE_URL missing',{status:503});
  if(f.get('action')==='delete'){
    await sql.query(`DELETE FROM ${t} WHERE id=$1`,[String(f.get('id'))]);
    return NextResponse.redirect(new URL(back(t),r.url),303);
  }
  const title=String(f.get('title')||'').trim(), body=String(f.get('body')||'').trim(), status=String(f.get('status')||'published');
  if(!title) return new NextResponse('Title required',{status:400});
  if(t==='poems') await sql`INSERT INTO poems(title,slug,author,body,status,original_language) VALUES(${title},${String(f.get('slug')||'')||slug(title)},${'Aseppudin Jaelani'},${body},${status},${'id'})`;
  else if(t==='photography'){
    const u=String(f.get('image_url')||''); if(!u)return new NextResponse('Image URL required',{status:400});
    await sql`INSERT INTO photography(title,image_url,description) VALUES(${title},${u},${body})`;
  }
  else if(t==='experiences') await sql`INSERT INTO experiences(title,description) VALUES(${title},${body})`;
  else if(t==='organizations') await sql`INSERT INTO organizations(name,description) VALUES(${title},${body})`;
  else if(t==='projects') await sql`INSERT INTO projects(name,slug,status,description) VALUES(${title},${slug(title)},${status},${body})`;
  else if(t==='achievements') await sql`INSERT INTO achievements(title,summary) VALUES(${title},${body})`;
  else if(t==='timeline_events') await sql`INSERT INTO timeline_events(title,description,year_label) VALUES(${title},${body},${String(f.get('slug')||'')})`;
  else if(t==='skills') await sql`INSERT INTO skills(name,description) VALUES(${title},${body})`;
  else if(t==='social_links') await sql`INSERT INTO social_links(platform,label,url,is_enabled) VALUES(${title},${title},${body},${true})`;
  else if(t==='translations') await sql`INSERT INTO translations(translation_key,locale,value) VALUES(${title},${String(f.get('slug')||'id')},${body})`;
  else if(t==='site_settings') await sql`INSERT INTO site_settings(setting_key,value) VALUES(${title},${JSON.stringify({value:body})}::jsonb) ON CONFLICT (setting_key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`;
  return NextResponse.redirect(new URL(back(t),r.url),303);
}